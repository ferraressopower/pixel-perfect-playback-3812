import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/AuthLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/recuperar-senha")({
  head: () => ({ meta: [{ title: "Recuperar senha — Panteron" }, { name: "description", content: "Receba um link para redefinir sua senha." }] }),
  component: Forgot,
});

function Forgot() {
  const [email, setEmail] = useState(""); const [sent, setSent] = useState(false); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/redefinir-senha` });
    setBusy(false);
    if (error) toast.error(error.message); else setSent(true);
  }
  return (
    <AuthLayout title="Recuperar senha" subtitle={sent ? "Se o e-mail existir, você receberá um link em instantes." : "Informe seu e-mail para receber o link."}>
      {!sent && <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2"><Label htmlFor="e">E-mail</Label><Input id="e" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <Button type="submit" className="w-full" disabled={busy || !supabase}>Enviar link</Button>
      </form>}
      <p className="mt-6 text-center text-sm"><Link to="/login" className="text-emerald hover:underline">Voltar ao login</Link></p>
    </AuthLayout>
  );
}
