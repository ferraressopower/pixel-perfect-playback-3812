import type { Lead } from "@/lib/leads/types";

const STYLES: Record<string, { label: string; cls: string }> = {
  has_site: { label: "COM SITE", cls: "border-border text-foreground" },
  confirmed_none: { label: "SEM SITE", cls: "border-emerald/40 bg-emerald-soft text-emerald" },
  not_informed: { label: "NÃO INFORMADO", cls: "border-border text-muted-foreground" },
  unverified: { label: "NÃO VERIFICADO", cls: "border-border text-muted-foreground" },
};

export function WebsiteBadge({ lead }: { lead: Pick<Lead, "website_status" | "phone" | "email"> }) {
  const s = STYLES[lead.website_status] ?? STYLES["unverified"]!;
  const incomplete = !lead.phone && !lead.email;
  return (
    <div className="flex flex-wrap gap-1">
      <span className={`whitespace-nowrap rounded border px-1.5 py-0.5 text-[10px] font-medium tracking-wide ${s.cls}`}>{s.label}</span>
      {incomplete && <span className="whitespace-nowrap rounded border border-border px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground">DADOS INCOMPLETOS</span>}
    </div>
  );
}
