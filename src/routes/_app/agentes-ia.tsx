import { createFileRoute } from "@tanstack/react-router";
import { Bot } from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_app/agentes-ia")({
  head: () => ({ meta: [{ title: "Agentes de IA — Panteron" }, { name: "description", content: "Assistentes para pesquisa, redação e abordagem." }] }),
  component: () => <ComingSoon title="Agentes de IA" description="Assistentes para pesquisa, redação e abordagem." icon={Bot} bullets={["Pesquisa de empresas", "Textos de abordagem", "Conteúdo para sites", "Histórico de gerações"]} />,
});
