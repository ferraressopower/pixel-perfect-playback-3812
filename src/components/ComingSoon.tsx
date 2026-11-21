import type { LucideIcon } from "lucide-react";
import { PageHeader } from "./PageHeader";

export function ComingSoon({ title, description, icon: Icon, bullets }: {
  title: string; description: string; icon: LucideIcon; bullets: string[];
}) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <div className="rounded-lg border border-dashed border-border bg-surface/50 p-10 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-emerald-soft">
          <Icon className="size-5 text-emerald" />
        </div>
        <h2 className="mt-4 text-base font-medium text-foreground">Módulo em preparação</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          Esta área será liberada nas próximas etapas. Nenhum dado é exibido até que o módulo esteja funcionando de verdade.
        </p>
        <ul className="mx-auto mt-6 grid max-w-lg gap-2 text-left text-sm text-muted-foreground sm:grid-cols-2">
          {bullets.map((b) => (
            <li key={b} className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-emerald" /> {b}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
