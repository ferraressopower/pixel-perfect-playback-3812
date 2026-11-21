import { createFileRoute } from "@tanstack/react-router";
import { KanbanSquare } from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_app/crm")({
  head: () => ({ meta: [{ title: "CRM — Panteron" }, { name: "description", content: "Acompanhe cada negociação do primeiro contato ao fechamento." }] }),
  component: () => <ComingSoon title="CRM" description="Acompanhe cada negociação do primeiro contato ao fechamento." icon={KanbanSquare} bullets={["Funil por etapas", "Histórico de interações", "Tarefas e lembretes", "Valor por negociação"]} />,
});
