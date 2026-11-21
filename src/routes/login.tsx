import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/AuthLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } =>
    typeof s["redirect"] === "string" && s["redirect"].startsWith("/") ? { redirect: s["redirect"] } : {},
  head: () => ({ meta: [{ title: "Entrar — Panteron" }, { name: "description", content: "Acesse sua conta Panteron." }] }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const { redirect } = Route.useSearch();
  const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    setBusy(false);
    if (error) return void toast.error(error.message === "Invalid login credentials" ? "E-mail ou senha incorretos" : error.message);
    nav({ to: redirect ?? "/dashboard" });
  }
  return (
    <AuthLayout title="Entrar" subtitle="Volte ao seu território.">
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2"><Label htmlFor="e">E-mail</Label><Input id="e" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="space-y-2">
          <div className="flex justify-between"><Label htmlFor="p">Senha</Label>
            <Link to="/recuperar-senha" className="text-xs text-muted-foreground hover:text-emerald">Esqueceu a senha?</Link></div>
          <Input id="p" type="password" required value={pw} onChange={(e) => setPw(e.target.value)} />
        </div>
        <Button type="submit" className="w-full" disabled={busy || !supabase}>Entrar</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">Novo por aqui? <Link to="/cadastro" className="text-emerald hover:underline">Criar conta</Link></p>
    </AuthLayout>
  );
}
