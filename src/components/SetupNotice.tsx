import { DatabaseZap } from "lucide-react";

export function SetupNotice() {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 text-sm">
      <div className="flex items-center gap-2 font-medium text-foreground">
        <DatabaseZap className="size-4 text-emerald" /> Conexão com o Supabase pendente
      </div>
      <p className="mt-1 text-muted-foreground">
        Defina <code className="text-foreground">VITE_SUPABASE_URL</code> e{" "}
        <code className="text-foreground">VITE_SUPABASE_ANON_KEY</code> do seu projeto Supabase externo para ativar o acesso.
      </p>
    </div>
  );
}
