import { createFileRoute } from "@tanstack/react-router";
import { Wallet } from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_app/financeiro")({
  head: () => ({ meta: [{ title: "Financeiro — Panteron" }, { name: "description", content: "Receita recorrente e recebimentos." }] }),
  component: () => <ComingSoon title="Financeiro" description="Receita recorrente e recebimentos." icon={Wallet} bullets={["Receita recorrente", "Recebimentos", "Inadimplência", "Relatórios"]} />,
});
