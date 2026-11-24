import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LEAD_STATUSES, type Lead, type LeadInput } from "@/lib/leads/types";
import { errorText, fetchDupCandidates, insertLeads, toRow, updateLead } from "@/lib/leads/queries";
import { findDuplicate } from "@/lib/leads/normalize";

const FIELDS: [keyof LeadInput, string][] = [
  ["company_name", "Nome da empresa *"], ["segment", "Categoria / segmento"], ["country", "País"], ["state", "Estado"],
  ["city", "Cidade"], ["neighborhood", "Bairro"], ["address", "Endereço"], ["phone", "Telefone comercial"],
  ["email", "Email comercial"], ["website_url", "Website"], ["source", "Fonte de origem"], ["source_url", "URL da fonte"],
];
const sel = "h-9 w-full rounded-md border border-input bg-background px-2 text-sm";

export function LeadForm({ open, onOpenChange, workspaceId, lead, onSaved }: {
  open: boolean; onOpenChange: (v: boolean) => void; workspaceId: string; lead?: Lead | null; onSaved: () => void;
}) {
  const init = (): LeadInput => lead ? {
    company_name: lead.company_name, segment: lead.segment ?? "", country: lead.country ?? "", state: lead.state ?? "",
    city: lead.city ?? "", neighborhood: lead.neighborhood ?? "", address: lead.address ?? "", phone: lead.phone ?? "",
    email: lead.email ?? "", website_url: lead.website_url ?? "", website_status: lead.website_status,
    description: lead.description ?? "", source: lead.source ?? "", source_url: lead.source_url ?? "", notes: lead.notes ?? "", status: lead.status,
  } : { company_name: "", country: "Brasil", source: "Cadastro manual", website_status: "unverified", status: "novo" };
  const [v, setV] = useState<LeadInput>(init);
  const [dupWarn, setDupWarn] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof LeadInput, val: string) => { setV((s) => ({ ...s, [k]: val })); setDupWarn(null); };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!v.company_name.trim()) { toast.error("Informe o nome da empresa."); return; }
    if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) { toast.error("Email inválido."); return; }
    setBusy(true);
    try {
      const row = toRow(v, workspaceId);
      if (!dupWarn) {
        const pool = (await fetchDupCandidates(workspaceId, [row])).filter((p) => p.id !== lead?.id);
        const d = findDuplicate(row, pool);
        if (d) { setDupWarn(`Possível duplicata de "${d.match.company_name}" (mesmo ${d.reason}). Clique novamente para confirmar.`); return; }
      }
      if (lead) { const { workspace_id: _w, ...patch } = row; await updateLead(lead.id, patch); }
      else await insertLeads([row]);
      toast.success(lead ? "Empresa atualizada." : "Empresa cadastrada.");
      onSaved(); onOpenChange(false);
    } catch (err) { toast.error(errorText(err)); } finally { setBusy(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>{lead ? "Editar empresa" : "Adicionar empresa manualmente"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          {FIELDS.map(([k, label]) => (
            <div key={k} className={k === "company_name" || k === "address" ? "sm:col-span-2" : ""}>
              <Label htmlFor={`f-${k}`} className="mb-1 block text-xs text-muted-foreground">{label}</Label>
              <Input id={`f-${k}`} value={(v[k] as string) ?? ""} onChange={(e) => set(k, e.target.value)} maxLength={300} />
            </div>
          ))}
          <div>
            <Label className="mb-1 block text-xs text-muted-foreground">Situação do website</Label>
            <select className={sel} value={v.website_status} onChange={(e) => set("website_status", e.target.value)}>
              <option value="unverified">Não verificado</option><option value="not_informed">Não informado pela fonte</option>
              <option value="confirmed_none">Sem site confirmado</option><option value="has_site">Com site</option>
            </select>
          </div>
          <div>
            <Label className="mb-1 block text-xs text-muted-foreground">Status comercial</Label>
            <select className={sel} value={v.status} onChange={(e) => set("status", e.target.value)}>
              {LEAD_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2"><Label className="mb-1 block text-xs text-muted-foreground">Descrição</Label>
            <Textarea value={v.description ?? ""} onChange={(e) => set("description", e.target.value)} maxLength={2000} rows={2} /></div>
          <div className="sm:col-span-2"><Label className="mb-1 block text-xs text-muted-foreground">Observações comerciais</Label>
            <Textarea value={v.notes ?? ""} onChange={(e) => set("notes", e.target.value)} maxLength={2000} rows={2} /></div>
          {dupWarn && <p className="sm:col-span-2 rounded-md border border-emerald/40 bg-emerald-soft p-2 text-sm text-foreground">{dupWarn}</p>}
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={busy}>{busy ? "Salvando…" : dupWarn ? "Salvar mesmo assim" : "Salvar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
