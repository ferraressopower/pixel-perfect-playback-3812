import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDownUp, Eye, ExternalLink, FileUp, MessageCircle, Pencil, Plus, Radar, Save, Search, Trash2, Info, DatabaseZap } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { workspacesQuery } from "@/hooks/use-workspace";
import { LeadForm } from "@/components/leads/LeadForm";
import { LeadDetailsSheet } from "@/components/leads/LeadDetailsSheet";
import { CsvImportWizard } from "@/components/leads/CsvImportWizard";
import { SearchHistory } from "@/components/leads/SearchHistory";
import { WebsiteBadge } from "@/components/leads/WebsiteBadge";
import { PAGE_SIZE, deleteLead, errorText, listLeads, recordSearch, saveToCrm, schemaReady, type LeadFilter, type SearchRow } from "@/lib/leads/queries";
import { externalProviders } from "@/lib/leads/providers";
import { websiteHref, whatsappLink } from "@/lib/leads/normalize";
import type { Lead } from "@/lib/leads/types";

export const Route = createFileRoute("/_app/buscar-empresas")({
  head: () => ({ meta: [
    { title: "Buscar empresas — Panteron" },
    { name: "description", content: "Encontre empresas, identifique oportunidades comerciais e descubra novos clientes." },
    { property: "og:title", content: "Buscar empresas — Panteron" },
    { property: "og:description", content: "Central de prospecção de empresas do Panteron." },
  ]}),
  loader: ({ context }) => context.queryClient.ensureQueryData(workspacesQuery),
  component: Page,
});

type Criteria = { country: string; state: string; city: string; neighborhood: string; segment: string; keywords: string; category: string; filter: LeadFilter };
const EMPTY: Criteria = { country: "", state: "", city: "", neighborhood: "", segment: "", keywords: "", category: "", filter: "all" };
const FILTERS: [LeadFilter, string][] = [["all", "Todas"], ["no_site", "Sem site"], ["with_site", "Com site"], ["with_phone", "Com telefone"], ["with_address", "Com endereço"], ["with_email", "Com email"]];
const COLS: [keyof Lead | null, string][] = [["company_name", "Empresa"], ["segment", "Segmento"], ["city", "Cidade"], ["state", "Estado"], ["phone", "Telefone"], ["email", "Email"], ["website_url", "Website"], ["website_status", "Situação"], ["source", "Fonte"], ["created_at", "Descoberta"]];

function Page() {
  const { data: ws } = useSuspenseQuery(workspacesQuery);
  const { user } = Route.useRouteContext();
  const active = ws[0];
  const ready = useQuery({ queryKey: ["schema-0002"], queryFn: schemaReady, staleTime: 60_000 });
  if (!active) return <p className="text-sm text-muted-foreground">Workspace ainda não encontrado. Recarregue em instantes.</p>;
  return (
    <div>
      <PageHeader title="Buscar empresas" description="Encontre empresas, identifique oportunidades comerciais e descubra novos clientes para seu negócio." />
      {ready.data === false && (
        <div className="mb-6 flex gap-3 rounded-lg border border-emerald/40 bg-emerald-soft p-4 text-sm">
          <DatabaseZap className="mt-0.5 size-4 shrink-0 text-emerald" />
          <p className="text-foreground">Falta atualizar o banco: rode o arquivo <code>docs/sql/0002_buscador.sql</code> no SQL Editor do seu Supabase para ativar cadastro, importação e histórico.</p>
        </div>
      )}
      <Finder workspaceId={active.id} userId={user.id} />
    </div>
  );
}

function Finder({ workspaceId, userId }: { workspaceId: string; userId: string }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Criteria>(EMPTY);
  const [applied, setApplied] = useState<Criteria>(EMPTY);
  const [tab, setTab] = useState("results");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<{ col: keyof Lead; asc: boolean }>({ col: "created_at", asc: false });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [details, setDetails] = useState<Lead | null>(null);
  const [editing, setEditing] = useState<Lead | null | "new">(null);
  const [importOpen, setImportOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Lead | null>(null);

  const params = { workspaceId, page, q, filter: applied.filter, sort: sort.col, asc: sort.asc, country: applied.country, state: applied.state, city: applied.city, neighborhood: applied.neighborhood, segment: applied.segment || applied.category, keywords: applied.keywords };
  const list = useQuery({ queryKey: ["leads", params], queryFn: () => listLeads(params), placeholderData: keepPreviousData });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["leads"] }); qc.invalidateQueries({ queryKey: ["dashboard-stats"] }); setSelected(new Set()); };

  async function runSearch(c: Criteria) {
    setApplied(c); setPage(0); setTab("results");
    try {
      const res = await qc.fetchQuery({ queryKey: ["leads", { ...params, ...c, segment: c.segment || c.category, page: 0 }], queryFn: () => listLeads({ ...params, ...c, segment: c.segment || c.category, page: 0 }) });
      const loc = [c.neighborhood, c.city, c.state, c.country].filter(Boolean).join(", ");
      await recordSearch(workspaceId, userId, [c.segment, c.category, c.keywords].filter(Boolean).join(" · "), loc, c, res.total);
      qc.invalidateQueries({ queryKey: ["searches"] }); qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success(`${res.total} empresa(s) encontrada(s) na sua base.`);
    } catch (e) { toast.error(errorText(e)); }
  }
  function repeat(s: SearchRow) { const c = { ...EMPTY, ...(s.filters ?? {}) }; setForm(c); runSearch(c); }

  async function saveCrm(ids: string[]) {
    try { await saveToCrm(ids); toast.success(`${ids.length} empresa(s) salva(s) no CRM.`); refresh(); setDetails((d) => d && ids.includes(d.id) ? { ...d, saved_to_crm: true } : d); }
    catch (e) { toast.error(errorText(e)); }
  }
  const rows = list.data?.rows ?? [];
  const total = list.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const allSel = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const f = (k: keyof Criteria) => ({ value: form[k], onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm((s) => ({ ...s, [k]: e.target.value })) });

  return (
    <>
      <form onSubmit={(e) => { e.preventDefault(); runSearch(form); }} className="rounded-lg border border-border bg-card p-5 shadow-card">
        <div className="grid gap-5 lg:grid-cols-2">
          <fieldset><legend className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Localização</legend>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="País" aria-label="País" {...f("country")} /><Input placeholder="Estado" aria-label="Estado" {...f("state")} />
              <Input placeholder="Cidade" aria-label="Cidade" {...f("city")} /><Input placeholder="Bairro (opcional)" aria-label="Bairro" {...f("neighborhood")} />
            </div></fieldset>
          <fieldset><legend className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Segmentação</legend>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Nicho ou segmento" aria-label="Segmento" {...f("segment")} /><Input placeholder="Categoria comercial" aria-label="Categoria" {...f("category")} />
              <Input className="col-span-2" placeholder="Palavras-chave" aria-label="Palavras-chave" {...f("keywords")} />
            </div></fieldset>
        </div>
        <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Filtros">
          {FILTERS.map(([v, l]) => (
            <button type="button" key={v} role="radio" aria-checked={form.filter === v} onClick={() => setForm((s) => ({ ...s, filter: v }))}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${form.filter === v ? "border-emerald/50 bg-emerald-soft text-emerald" : "border-border text-muted-foreground hover:text-foreground"}`}>{l}</button>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="submit"><Radar className="size-4" /> Buscar empresas</Button>
          <Button type="button" variant="outline" onClick={() => setImportOpen(true)}><FileUp className="size-4" /> Importar CSV</Button>
          <Button type="button" variant="outline" onClick={() => setEditing("new")}><Plus className="size-4" /> Adicionar empresa manualmente</Button>
          <Button type="button" variant="ghost" onClick={() => { setForm(EMPTY); setApplied(EMPTY); setPage(0); }}>Limpar</Button>
        </div>
        <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground"><Info className="mt-0.5 size-3.5 shrink-0" />
          A busca percorre as empresas já cadastradas ou importadas no seu workspace. Fontes externas ({externalProviders.map((p) => p.name).join(", ")}) ainda não estão configuradas e não geram resultados.</p>
      </form>

      <Tabs value={tab} onValueChange={setTab} className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList><TabsTrigger value="results">Resultados ({total})</TabsTrigger><TabsTrigger value="history">Histórico de pesquisas</TabsTrigger></TabsList>
          {tab === "results" && (
            <div className="flex flex-wrap items-center gap-2">
              {selected.size > 0 && <Button size="sm" onClick={() => saveCrm([...selected])}><Save className="size-4" /> Salvar selecionados no CRM ({selected.size})</Button>}
              <div className="relative"><Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input className="w-64 pl-8" placeholder="Pesquisar nos resultados" aria-label="Pesquisar nos resultados" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} /></div>
            </div>
          )}
        </div>
        <TabsContent value="results" className="mt-4">
          {list.error ? <p className="rounded-lg border border-border p-6 text-sm text-destructive">{errorText(list.error)}</p>
          : list.isLoading ? <p className="p-6 text-sm text-muted-foreground">Carregando empresas…</p>
          : rows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-12 text-center">
              <Radar className="mx-auto size-6 text-emerald" />
              <p className="mt-3 font-medium text-foreground">Nenhuma empresa encontrada</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Importe um CSV ou cadastre empresas manualmente para começar a rastrear oportunidades.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="border-b border-border text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="p-3"><input type="checkbox" aria-label="Selecionar todos" checked={allSel} onChange={() => setSelected(allSel ? new Set() : new Set(rows.map((r) => r.id)))} /></th>
                    {COLS.map(([c, l]) => (
                      <th key={l} className="whitespace-nowrap p-3 font-medium">
                        <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => c && setSort((s) => ({ col: c, asc: s.col === c ? !s.asc : true }))}>
                          {l}<ArrowDownUp className={`size-3 ${sort.col === c ? "text-emerald" : "opacity-40"}`} /></button>
                      </th>
                    ))}
                    <th className="p-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const wa = whatsappLink(r.phone); const site = websiteHref(r.website_url);
                    return (
                      <tr key={r.id} className="border-b border-border/60 last:border-0 hover:bg-accent/40">
                        <td className="p-3"><input type="checkbox" aria-label={`Selecionar ${r.company_name}`} checked={selected.has(r.id)} onChange={() => setSelected((s) => { const n = new Set(s); n.has(r.id) ? n.delete(r.id) : n.add(r.id); return n; })} /></td>
                        <td className="p-3"><button className="text-left font-medium text-foreground hover:text-emerald" onClick={() => setDetails(r)}>{r.company_name}</button>{r.saved_to_crm && <span className="ml-2 text-[10px] text-emerald">CRM</span>}</td>
                        <td className="p-3 text-muted-foreground">{r.segment ?? "—"}</td><td className="p-3 text-muted-foreground">{r.city ?? "—"}</td><td className="p-3 text-muted-foreground">{r.state ?? "—"}</td>
                        <td className="whitespace-nowrap p-3 text-muted-foreground">{r.phone ?? "—"}</td><td className="p-3 text-muted-foreground">{r.email ?? "—"}</td>
                        <td className="max-w-40 truncate p-3 text-muted-foreground">{r.website_url ?? "—"}</td>
                        <td className="p-3"><WebsiteBadge lead={r} /></td>
                        <td className="p-3 text-xs text-muted-foreground">{r.source ?? "—"}</td>
                        <td className="whitespace-nowrap p-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("pt-BR")}</td>
                        <td className="p-3"><div className="flex gap-0.5">
                          <IconBtn label="Ver detalhes" onClick={() => setDetails(r)}><Eye className="size-4" /></IconBtn>
                          <IconBtn label="Salvar lead" disabled={r.saved_to_crm} onClick={() => saveCrm([r.id])}><Save className="size-4" /></IconBtn>
                          <IconBtn label="Editar" onClick={() => setEditing(r)}><Pencil className="size-4" /></IconBtn>
                          <IconBtn label="Abrir website" href={site}><ExternalLink className="size-4" /></IconBtn>
                          <IconBtn label="Abrir WhatsApp" href={wa}><MessageCircle className="size-4" /></IconBtn>
                          <IconBtn label="Excluir" onClick={() => setToDelete(r)}><Trash2 className="size-4" /></IconBtn>
                        </div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="flex items-center justify-between border-t border-border p-3 text-xs text-muted-foreground">
                <span>{total} empresa(s) · página {page + 1} de {pages}</span>
                <div className="flex gap-2"><Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
                  <Button size="sm" variant="outline" disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)}>Próxima</Button></div>
              </div>
            </div>
          )}
        </TabsContent>
        <TabsContent value="history" className="mt-4"><SearchHistory workspaceId={workspaceId} userId={userId} onRepeat={repeat} /></TabsContent>
      </Tabs>

      {editing && <LeadForm open onOpenChange={(o) => !o && setEditing(null)} workspaceId={workspaceId} lead={editing === "new" ? null : editing}
        onSaved={() => { refresh(); setDetails(null); }} />}
      <CsvImportWizard open={importOpen} onOpenChange={setImportOpen} workspaceId={workspaceId} onDone={refresh} />
      <LeadDetailsSheet lead={details} onClose={() => setDetails(null)} onEdit={(l) => setEditing(l)} onSaveCrm={(l) => saveCrm([l.id])} />
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir {toDelete?.company_name}?</AlertDialogTitle><AlertDialogDescription>A empresa e seu histórico serão removidos deste workspace. Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { if (!toDelete) return; try { await deleteLead(toDelete.id); toast.success("Empresa excluída."); refresh(); } catch (e) { toast.error(errorText(e)); } }}>Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function IconBtn({ label, onClick, href, disabled, children }: { label: string; onClick?: () => void; href?: string | null; disabled?: boolean; children: React.ReactNode }) {
  const cls = "rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-emerald disabled:pointer-events-none disabled:opacity-30";
  if (href !== undefined) return href ? <a href={href} target="_blank" rel="noreferrer" aria-label={label} title={label} className={cls}>{children}</a>
    : <button disabled aria-label={`${label} (indisponível)`} title={`${label} indisponível`} className={cls}>{children}</button>;
  return <button onClick={onClick} disabled={disabled} aria-label={label} title={label} className={cls}>{children}</button>;
}
