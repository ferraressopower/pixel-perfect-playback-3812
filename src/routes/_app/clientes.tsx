import { createFileRoute } from "@tanstack/react-router";
import { Handshake } from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_app/clientes")({
  head: () => ({ meta: [{ title: "Clientes — Panteron" }, { name: "description", content: "Empresas que já fecharam com você." }] }),
  component: () => <ComingSoon title="Clientes" description="Empresas que já fecharam com você." icon={Handshake} bullets={["Carteira de clientes", "Sites ativos", "Valor mensal", "Renovações"]} />,
});
