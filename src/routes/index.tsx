import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({ meta: [
    { title: "Panteron — Caça inteligente de oportunidades comerciais" },
    { name: "description", content: "Encontre empresas, identifique quem precisa de um site e transforme oportunidades em clientes." },
    { property: "og:title", content: "Panteron — Caça inteligente de oportunidades" },
    { property: "og:description", content: "Prospecção, leads, criação de sites e CRM em uma só plataforma." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ]}),
  beforeLoad: async () => {
    const session = supabase ? (await supabase.auth.getSession()).data.session : null;
    throw redirect({ to: session ? "/dashboard" : "/login" });
  },
});
