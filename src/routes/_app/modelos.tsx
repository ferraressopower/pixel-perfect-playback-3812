import { createFileRoute } from "@tanstack/react-router";
import { LayoutTemplate } from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_app/modelos")({
  head: () => ({ meta: [{ title: "Modelos de sites — Panteron" }, { name: "description", content: "Modelos prontos por segmento de negócio." }] }),
  component: () => <ComingSoon title="Modelos de sites" description="Modelos prontos por segmento de negócio." icon={LayoutTemplate} bullets={["Biblioteca por segmento", "Modelos do workspace", "Duplicar e personalizar", "Prévia rápida"]} />,
});
