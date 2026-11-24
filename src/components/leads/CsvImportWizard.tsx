import { useState } from "react";
import { toast } from "sonner";
import { Download, FileUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { requireSupabase } from "@/lib/supabase";
import { CSV_FIELDS, CSV_LABELS, MAX_CSV_BYTES, MAX_CSV_ROWS, applyMap, autoMap, parseCsv, templateCsv, validateRow, type CsvField } from "@/lib/leads/csv";
import { findDuplicate, normalizeDomain, normalizeName, normalizePhone } from "@/lib/leads/normalize";
import { errorText, fetchDupCandidates, insertLeads, toRow } from "@/lib/leads/queries";

type Checked = { idx: number; data: Record<CsvField, string>; raw: Record<string, string>; error: string | null; dup: string | null; include: boolean };
type Report = { total: number; imported: number; duplicates: number; invalid: number; ignored: number };

export function downloadTemplate() {
  const blob = new Blob(["\uFEFF" + templateCsv()], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "modelo-panteron.csv"; a.click();
  URL.revokeObjectURL(a.href);
}

export function CsvImportWizard({ open, onOpenChange, workspaceId, onDone }: { open: boolean; onOpenChange: (v: boolean) => void; workspaceId: string; onDone: () => void }) {
  const [step, setStep] = useState<"file" | "map" | "review" | "done">("file");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [map, setMap] = useState<Partial<Record<CsvField, string>>>({});
  const [checked, setChecked] = useState<Checked[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState(false);

  function reset() { setStep("file"); setHeaders([]); setRows([]); setMap({}); setChecked([]); setReport(null); setFileName(""); }

  async function onFile(f: File | undefined) {
    if (!f) return;
    if (f.size > MAX_CSV_BYTES) { toast.error("Arquivo maior que 5 MB."); return; }
    if (!/\.csv$/i.test(f.name)) { toast.error("Envie um arquivo .csv"); return; }
    const { headers: h, rows: r } = parseCsv(await f.text());
    if (!h.length || !r.length) { toast.error("Não encontrei colunas ou linhas no arquivo."); return; }
    setFileName(f.name); setHeaders(h); setRows(r); setMap(autoMap(h)); setStep("map");
  }

  async function validate() {
    if (!map.company_name) { toast.error("Mapeie a coluna do nome da empresa."); return; }
    setBusy(true);
    try {
      const prepared = rows.map((raw, idx) => {
        const data = applyMap(raw, map);
        return { idx, raw, data, key: { normalized_name: normalizeName(data.company_name), normalized_phone: normalizePhone(data.phone), normalized_domain: normalizeDomain(data.website) } };
      });
      const existing = await fetchDupCandidates(workspaceId, prepared.map((p) => p.key));
      const seen: typeof prepared[number]["key"][] = [];
      const out: Checked[] = prepared.map((p) => {
        const error = validateRow(p.data);
        let dup: string | null = null;
        if (!error) {
          const e = findDuplicate(p.key, existing);
          if (e) dup = `Já existe "${e.match.company_name}" (${e.reason})`;
          else if (findDuplicate(p.key, seen)) dup = "Repetida no próprio arquivo";
          seen.push(p.key);
        }
        return { idx: p.idx, raw: p.raw, data: p.data, error, dup, include: !error && !dup };
      });
      setChecked(out); setStep("review");
    } catch (e) { toast.error(errorText(e)); } finally { setBusy(false); }
  }

  async function confirm() {
    setBusy(true);
    try {
      const chosen = checked.filter((c) => c.include && !c.error);
      const payload = chosen.map((c) => ({
        ...toRow({ company_name: c.data.company_name, segment: c.data.category, country: c.data.country || "Brasil", state: c.data.state, city: c.data.city,
          neighborhood: c.data.neighborhood, address: c.data.address, phone: c.data.phone, email: c.data.email, website_url: c.data.website,
          description: c.data.description, source: c.data.source || `CSV: ${fileName}` }, workspaceId),
        raw_data: c.raw,
      }));
      const imported = payload.length ? await insertLeads(payload) : 0;
      const r: Report = {
        total: checked.length, imported,
        duplicates: checked.filter((c) => c.dup).length,
        invalid: checked.filter((c) => c.error).length,
        ignored: checked.filter((c) => !c.error && !c.include).length,
      };
      await requireSupabase().from("csv_imports").insert({ workspace_id: workspaceId, file_name: fileName.slice(0, 200), total_rows: r.total, imported: r.imported, duplicates: r.duplicates, invalid: r.invalid, ignored: r.ignored });
      setReport(r); setStep("done"); onDone();
      toast.success(`${imported} empresa(s) importada(s).`);
    } catch (e) { toast.error(errorText(e)); } finally { setBusy(false); }
  }

  const toImport = checked.filter((c) => c.include && !c.error).length;
  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader><DialogTitle>Importar CSV</DialogTitle></DialogHeader>
        <ol className="flex gap-4 text-xs text-muted-foreground">
          {["Arquivo", "Colunas", "Revisão", "Relatório"].map((s, i) => (
            <li key={s} className={["file", "map", "review", "done"].indexOf(step) >= i ? "text-emerald" : ""}>{i + 1}. {s}</li>
          ))}
        </ol>

        {step === "file" && (
          <div className="space-y-4">
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-border p-10 text-center hover:border-emerald/40">
              <FileUp className="size-6 text-emerald" />
              <span className="text-sm text-foreground">Selecionar arquivo .csv</span>
              <span className="text-xs text-muted-foreground">Até 5 MB e {MAX_CSV_ROWS.toLocaleString("pt-BR")} linhas</span>
              <input type="file" accept=".csv,text/csv" className="sr-only" aria-label="Arquivo CSV" onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
            <Button variant="outline" size="sm" onClick={downloadTemplate}><Download className="size-4" /> Baixar modelo CSV</Button>
          </div>
        )}

        {step === "map" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{fileName}: {rows.length} linha(s), {headers.length} coluna(s). Confira de qual coluna vem cada campo.</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {CSV_FIELDS.map((f) => (
                <label key={f} className="text-xs text-muted-foreground">{CSV_LABELS[f]}{f === "company_name" && " *"}
                  <select className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground" value={map[f] ?? ""}
                    onChange={(e) => setMap((m) => ({ ...m, [f]: e.target.value || undefined }))}>
                    <option value="">— ignorar —</option>
                    {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </label>
              ))}
            </div>
            <Preview rows={rows.slice(0, 5).map((r) => applyMap(r, map))} />
            <DialogFooter><Button variant="ghost" onClick={reset}>Voltar</Button><Button onClick={validate} disabled={busy}>{busy ? "Validando…" : "Validar registros"}</Button></DialogFooter>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-sm">
              <Kpi l="Encontrados" v={checked.length} /><Kpi l="Válidos novos" v={checked.filter((c) => !c.error && !c.dup).length} />
              <Kpi l="Possíveis duplicados" v={checked.filter((c) => c.dup).length} /><Kpi l="Inválidos" v={checked.filter((c) => c.error).length} />
            </div>
            <div className="max-h-80 overflow-auto rounded-md border border-border">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-surface text-left text-muted-foreground"><tr><th className="p-2">Importar</th><th className="p-2">Empresa</th><th className="p-2">Cidade</th><th className="p-2">Telefone</th><th className="p-2">Situação</th></tr></thead>
                <tbody>{checked.map((c) => (
                  <tr key={c.idx} className="border-t border-border">
                    <td className="p-2"><input type="checkbox" disabled={!!c.error} checked={c.include} aria-label={`Importar linha ${c.idx + 1}`}
                      onChange={(e) => setChecked((all) => all.map((x) => x.idx === c.idx ? { ...x, include: e.target.checked } : x))} /></td>
                    <td className="p-2 text-foreground">{c.data.company_name || "—"}</td><td className="p-2">{c.data.city}</td><td className="p-2">{c.data.phone}</td>
                    <td className="p-2">{c.error ? <span className="text-destructive">{c.error}</span> : c.dup ? <span className="text-emerald">{c.dup}</span> : "OK"}</td>
                  </tr>))}</tbody>
              </table>
            </div>
            <p className="text-sm text-foreground">{toImport} registro(s) serão importados. Duplicados ficam desmarcados; marque se quiser importá-los mesmo assim.</p>
            <DialogFooter><Button variant="ghost" onClick={() => setStep("map")}>Voltar</Button><Button onClick={confirm} disabled={busy || toImport === 0}>{busy ? "Importando…" : `Confirmar importação (${toImport})`}</Button></DialogFooter>
          </div>
        )}

        {step === "done" && report && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 text-sm">
              <Kpi l="Encontrados" v={report.total} /><Kpi l="Importados" v={report.imported} /><Kpi l="Duplicados" v={report.duplicates} />
              <Kpi l="Inválidos" v={report.invalid} /><Kpi l="Ignorados" v={report.ignored} />
            </div>
            <DialogFooter><Button onClick={() => { onOpenChange(false); reset(); }}>Concluir</Button></DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Kpi({ l, v }: { l: string; v: number }) {
  return <div className="rounded-md border border-border bg-surface p-3"><div className="text-xs text-muted-foreground">{l}</div><div className="font-display text-xl text-foreground tabular-nums">{v}</div></div>;
}
function Preview({ rows }: { rows: Record<CsvField, string>[] }) {
  return (
    <div className="overflow-auto rounded-md border border-border">
      <table className="w-full text-xs"><thead className="bg-surface text-left text-muted-foreground"><tr>{CSV_FIELDS.map((f) => <th key={f} className="whitespace-nowrap p-2">{CSV_LABELS[f]}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i} className="border-t border-border">{CSV_FIELDS.map((f) => <td key={f} className="max-w-40 truncate p-2">{r[f]}</td>)}</tr>)}</tbody></table>
    </div>
  );
}
