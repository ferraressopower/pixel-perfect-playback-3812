import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_app/leads")({
  head: () => ({ meta: [{ title: "Leads — Panteron" }, { name: "description", content: "Empresas qualificadas prontas para abordagem." }] }),
  component: () => <ComingSoon title="Leads" description="Empresas qualificadas prontas para abordagem." icon={Users} bullets={["Lista com filtros", "Contatos por empresa", "Origem de cada lead", "Importação e exportação"]} />,
});
