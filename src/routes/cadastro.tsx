import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/AuthLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/cadastro")({
  head: () => ({ meta: [{ title: "Criar conta — Panteron" }, { name: "description", content: "Crie sua conta e seu workspace no Panteron." }] }),
  component: SignUp,
});

function SignUp() {
  const [f, setF] = useState({ name: "", company: "", email: "", pw: "" });
  const [busy, setBusy] = useState(false); const [sent, setSent] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!supabase) return;
    if (f.pw.length < 8) return void toast.error("A senha precisa ter ao menos 8 caracteres");
    setBusy(true);
    // full_name and workspace_name feed the on-signup trigger that creates profile + workspace.
    const { data, error } = await supabase.auth.signUp({
      email: f.email, password: f.pw,
      options: { emailRedirectTo: window.location.origin, data: { full_name: f.name, workspace_name: f.company || f.name } },
    });
    setBusy(false);
    if (error) return void toast.error(error.message);
    if (data.session) window.location.assign("/dashboard"); else setSent(true);
  }
  if (sent) return (
    <AuthLayout title="Confirme seu e-mail" subtitle={`Enviamos um link de confirmação para ${f.email}.`}>
      <Link to="/login" className="text-sm text-emerald hover:underline">Voltar ao login</Link>
    </AuthLayout>
  );
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <AuthLayout title="Criar conta" subtitle="Seu workspace é criado automaticamente.">
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2"><Label htmlFor="n">Seu nome</Label><Input id="n" required value={f.name} onChange={set("name")} /></div>
        <div className="space-y-2"><Label htmlFor="c">Nome da empresa</Label><Input id="c" value={f.company} onChange={set("company")} /></div>
        <div className="space-y-2"><Label htmlFor="e">E-mail</Label><Input id="e" type="email" required value={f.email} onChange={set("email")} /></div>
        <div className="space-y-2"><Label htmlFor="p">Senha</Label><Input id="p" type="password" required value={f.pw} onChange={set("pw")} /></div>
        <Button type="submit" className="w-full" disabled={busy || !supabase}>Criar conta</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">Já tem conta? <Link to="/login" className="text-emerald hover:underline">Entrar</Link></p>
    </AuthLayout>
  );
}
