import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Building2, Users, Globe2, Wand2, Handshake, TrendingUp, Radar, type LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { requireSupabase } from "@/lib/supabase";
import { workspacesQuery } from "@/hooks/use-workspace";
import { formatBRL } from "@/lib/format";

const statsQuery = (workspaceId: string) => queryOptions({
  queryKey: ["dashboard-stats", workspaceId],
  queryFn: async () => {
    const sb = requireSupabase();
    const count = async (table: string, f?: (q: any) => any) => {
      let q = sb.from(table).select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId);
      if (f) q = f(q);
      const { count: c, error } = await q;
      if (error) throw error;
      return c ?? 0;
    };
    const [found, leads, noSite, sites, clients, mrr] = await Promise.all([
      count("leads"),
      count("leads", (q) => q.in("status", ["lead", "client"])),
      count("leads", (q) => q.eq("has_website", false)),
      count("websites"),
      count("leads", (q) => q.eq("status", "client")),
      sb.from("leads").select("monthly_value_cents").eq("workspace_id", workspaceId).eq("status", "client")
        .then(({ data, error }) => { if (error) throw error; return (data ?? []).reduce((s, r: any) => s + (r.monthly_value_cents ?? 0), 0); }),
    ]);
    return { found, leads, noSite, sites, clients, mrr };
  },
});

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [
    { title: "Dashboard — Panteron" },
    { name: "description", content: "Visão geral das oportunidades do seu workspace." },
  ]}),
  loader: async ({ context }) => {
    const ws = await context.queryClient.ensureQueryData(workspacesQuery);
    if (ws[0]) await context.queryClient.ensureQueryData(statsQuery(ws[0].id));
  },
  component: Dashboard,
});

function Stat({ label, value, icon: Icon, hint }: { label: string; value: string; icon: LucideIcon; hint: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-card transition-colors hover:border-emerald/30">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="mt-4 font-display text-3xl font-semibold tabular-nums text-foreground">{value}</div>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function Dashboard() {
  const { data: ws } = useSuspenseQuery(workspacesQuery);
  const active = ws[0];
  if (!active) {
    return (<div><PageHeader title="Dashboard" />
      <p className="text-sm text-muted-foreground">Seu workspace ainda está sendo criado. Recarregue em instantes.</p></div>);
  }
  return <Stats workspaceId={active.id} name={active.name} />;
}

function Stats({ workspaceId, name }: { workspaceId: string; name: string }) {
  const { data: s } = useSuspenseQuery(statsQuery(workspaceId));
  const empty = s.found === 0 && s.sites === 0;
  const n = (v: number) => v.toLocaleString("pt-BR");
  return (
    <div>
      <PageHeader title="Dashboard" description={`Território: ${name}`} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Stat label="Empresas encontradas" value={n(s.found)} icon={Building2} hint="Total rastreado nas buscas" />
        <Stat label="Leads cadastrados" value={n(s.leads)} icon={Users} hint="Qualificados para abordagem" />
        <Stat label="Empresas sem site" value={n(s.noSite)} icon={Globe2} hint="Oportunidades diretas" />
        <Stat label="Sites criados" value={n(s.sites)} icon={Wand2} hint="No criador de sites" />
        <Stat label="Clientes conquistados" value={n(s.clients)} icon={Handshake} hint="Negócios fechados" />
        <Stat label="Receita recorrente" value={formatBRL(s.mrr)} icon={TrendingUp} hint="Mensal, dos clientes ativos" />
      </div>
      {empty && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-surface p-6">
          <div className="flex items-center gap-4">
            <div className="flex size-10 items-center justify-center rounded-md bg-emerald-soft"><Radar className="size-5 text-emerald" /></div>
            <div>
              <p className="font-medium text-foreground">Nenhuma empresa rastreada ainda</p>
              <p className="text-sm text-muted-foreground">Os indicadores serão preenchidos com dados reais assim que as buscas começarem.</p>
            </div>
          </div>
          <Link to="/buscar-empresas" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Ver busca de empresas</Link>
        </div>
      )}
    </div>
  );
}
