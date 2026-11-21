import { createFileRoute } from "@tanstack/react-router";
import { FolderKanban } from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_app/projetos")({
  head: () => ({ meta: [{ title: "Projetos — Panteron" }, { name: "description", content: "Organize as entregas de cada cliente." }] }),
  component: () => <ComingSoon title="Projetos" description="Organize as entregas de cada cliente." icon={FolderKanban} bullets={["Status por projeto", "Sites vinculados", "Prazos", "Responsáveis"]} />,
});
