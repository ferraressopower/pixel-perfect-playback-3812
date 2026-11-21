import { createFileRoute } from "@tanstack/react-router";
import { Wand2 } from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_app/criador-de-sites")({
  head: () => ({ meta: [{ title: "Criador de sites — Panteron" }, { name: "description", content: "Crie sites profissionais para seus prospects." }] }),
  component: () => <ComingSoon title="Criador de sites" description="Crie sites profissionais para seus prospects." icon={Wand2} bullets={["Editor visual", "Páginas e seções", "Publicação com domínio", "Prévia para o cliente"]} />,
});
