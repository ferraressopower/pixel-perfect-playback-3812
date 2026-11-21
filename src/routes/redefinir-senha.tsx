import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/AuthLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/redefinir-senha")({
  ssr: false,
  head: () => ({ meta: [{ title: "Nova senha — Panteron" }, { name: "description", content: "Defina uma nova senha para sua conta." }] }),
  component: Reset,
});

function Reset() {
  const nav = useNavigate();
  const [pw, setPw] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!supabase) return;
    if (pw.length < 8) return void toast.error("A senha precisa ter ao menos 8 caracteres");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return void toast.error(error.message);
    toast.success("Senha atualizada"); nav({ to: "/dashboard" });
  }
  return (
    <AuthLayout title="Nova senha" subtitle="Escolha uma senha forte.">
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2"><Label htmlFor="p">Nova senha</Label><Input id="p" type="password" required value={pw} onChange={(e) => setPw(e.target.value)} /></div>
        <Button type="submit" className="w-full" disabled={busy || !supabase}>Salvar nova senha</Button>
      </form>
    </AuthLayout>
  );
}
