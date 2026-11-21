import { createFileRoute } from "@tanstack/react-router";
import { Megaphone } from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_app/campanhas")({
  head: () => ({ meta: [{ title: "Campanhas — Panteron" }, { name: "description", content: "Planeje sequências de contato com seus leads." }] }),
  component: () => <ComingSoon title="Campanhas" description="Planeje sequências de contato com seus leads." icon={Megaphone} bullets={["Sequências de mensagens", "Público por filtro", "Métricas de resposta", "Modelos de mensagem"]} />,
});
