import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { requireSupabase } from "@/lib/supabase";
import { workspacesQuery } from "@/hooks/use-workspace";
import { useSuspenseQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_app/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — Panteron" }, { name: "description", content: "Perfil e workspace." }] }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(workspacesQuery);
    const sb = requireSupabase();
    const { data: u } = await sb.auth.getUser();
    const { data } = await sb.from("profiles").select("full_name").eq("id", u.user!.id).maybeSingle();
    return { userId: u.user!.id, email: u.user!.email ?? "", fullName: (data?.full_name as string) ?? "" };
  },
  component: Settings,
});

function Settings() {
  const p = Route.useLoaderData();
  const { data: ws } = useSuspenseQuery(workspacesQuery);
  const [name, setName] = useState(p.fullName);
  const [saving, setSaving] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await requireSupabase().from("profiles").update({ full_name: name }).eq("id", p.userId);
    setSaving(false);
    if (error) toast.error("Não foi possível salvar"); else toast.success("Perfil atualizado");
  }
  return (
    <div>
      <PageHeader title="Configurações" description="Seu perfil e o workspace ativo." />
      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={save} className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-card">
          <h2 className="font-medium">Perfil</h2>
          <div className="space-y-2"><Label>E-mail</Label><Input value={p.email} disabled /></div>
          <div className="space-y-2"><Label htmlFor="n">Nome</Label><Input id="n" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <Button type="submit" disabled={saving}>Salvar</Button>
        </form>
        <div className="space-y-3 rounded-lg border border-border bg-card p-6 shadow-card">
          <h2 className="font-medium">Workspace</h2>
          {ws.map((w) => (
            <div key={w.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
              <span>{w.name}</span><span className="text-xs uppercase tracking-wider text-emerald">{w.role}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
