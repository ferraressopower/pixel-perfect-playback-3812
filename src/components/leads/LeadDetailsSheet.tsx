import { useQuery } from "@tanstack/react-query";
import { ExternalLink, MessageCircle, Pencil, Save } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { leadEvents } from "@/lib/leads/queries";
import { statusLabel, type Lead } from "@/lib/leads/types";
import { websiteHref, whatsappLink } from "@/lib/leads/normalize";
import { WebsiteBadge } from "./WebsiteBadge";

const LABELS: Record<string, string> = { company_name: "Nome", segment: "Segmento", status: "Status", phone: "Telefone", email: "Email", website_url: "Website", website_status: "Situação do site", notes: "Observações", saved_to_crm: "CRM", city: "Cidade", state: "Estado", address: "Endereço" };

export function LeadDetailsSheet({ lead, onClose, onEdit, onSaveCrm }: { lead: Lead | null; onClose: () => void; onEdit: (l: Lead) => void; onSaveCrm: (l: Lead) => void }) {
  const ev = useQuery({ queryKey: ["lead-events", lead?.id, lead?.updated_at], queryFn: () => leadEvents(lead!.id), enabled: !!lead });
  if (!lead) return null;
  const wa = whatsappLink(lead.phone); const site = websiteHref(lead.website_url);
  const rows: [string, string | null][] = [
    ["Segmento", lead.segment], ["Endereço", [lead.address, lead.neighborhood].filter(Boolean).join(" — ") || null],
    ["Cidade", lead.city], ["Estado", lead.state], ["País", lead.country], ["Telefone", lead.phone], ["Email", lead.email],
    ["Website", lead.website_url], ["Descrição", lead.description], ["Fonte", lead.source], ["URL da fonte", lead.source_url],
    ["Status no CRM", `${statusLabel(lead.status)}${lead.saved_to_crm ? " · salvo no CRM" : ""}`], ["Observações", lead.notes],
    ["Descoberta", new Date(lead.created_at).toLocaleString("pt-BR")], ["Última atualização", new Date(lead.updated_at).toLocaleString("pt-BR")],
  ];
  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader><SheetTitle className="text-left">{lead.company_name}</SheetTitle></SheetHeader>
        <div className="mt-2"><WebsiteBadge lead={lead} /></div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button size="sm" variant="outline" onClick={() => onEdit(lead)}><Pencil className="size-4" /> Editar empresa</Button>
          <Button size="sm" onClick={() => onSaveCrm(lead)} disabled={lead.saved_to_crm}><Save className="size-4" /> {lead.saved_to_crm ? "Já no CRM" : "Salvar no CRM"}</Button>
          {wa ? <Button size="sm" variant="outline" asChild><a href={wa} target="_blank" rel="noreferrer"><MessageCircle className="size-4" /> Abrir WhatsApp</a></Button>
            : <Button size="sm" variant="outline" disabled><MessageCircle className="size-4" /> Sem WhatsApp válido</Button>}
          {site ? <Button size="sm" variant="outline" asChild><a href={site} target="_blank" rel="noreferrer"><ExternalLink className="size-4" /> Abrir website</a></Button>
            : <Button size="sm" variant="outline" disabled><ExternalLink className="size-4" /> Sem website</Button>}
        </div>
        <dl className="mt-6 space-y-2 text-sm">
          {rows.map(([k, v]) => <div key={k} className="grid grid-cols-3 gap-2"><dt className="text-muted-foreground">{k}</dt><dd className="col-span-2 break-words text-foreground">{v || "—"}</dd></div>)}
        </dl>
        <h3 className="mt-8 text-sm font-medium text-foreground">Histórico de alterações</h3>
        <ul className="mt-2 space-y-2 text-xs">
          {ev.isLoading && <li className="text-muted-foreground">Carregando…</li>}
          {ev.error && <li className="text-muted-foreground">Histórico indisponível até rodar o arquivo 0002.</li>}
          {ev.data?.length === 0 && <li className="text-muted-foreground">Sem alterações registradas.</li>}
          {ev.data?.map((e: any) => (
            <li key={e.id} className="rounded border border-border p-2">
              <span className="text-muted-foreground">{new Date(e.created_at).toLocaleString("pt-BR")} · </span>
              {e.kind === "created" ? "Empresa criada" : Object.keys(e.changes).map((k) => LABELS[k] ?? k).join(", ") + " alterado(s)"}
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
