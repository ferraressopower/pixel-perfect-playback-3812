import { createFileRoute } from "@tanstack/react-router";
import { Radar } from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_app/buscar-empresas")({
  head: () => ({ meta: [{ title: "Buscar empresas — Panteron" }, { name: "description", content: "Rastreie empresas por região, segmento e presença digital." }] }),
  component: () => <ComingSoon title="Buscar empresas" description="Rastreie empresas por região, segmento e presença digital." icon={Radar} bullets={["Busca por cidade e segmento", "Detecção de empresas sem site", "Filtros por avaliação", "Envio direto para Leads"]} />,
});
