import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { History, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { deleteSearch, errorText, listSearches, type SearchRow } from "@/lib/leads/queries";

export function SearchHistory({ workspaceId, userId, onRepeat }: { workspaceId: string; userId: string; onRepeat: (s: SearchRow) => void }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["searches", workspaceId], queryFn: () => listSearches(workspaceId) });
  if (q.isLoading) return <p className="text-sm text-muted-foreground">Carregando histórico…</p>;
  if (q.error) return <p className="text-sm text-destructive">{errorText(q.error)}</p>;
  if (!q.data?.length) return (
    <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
      <History className="mx-auto mb-3 size-5 text-emerald" />Nenhuma pesquisa realizada ainda.
    </div>
  );
  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-card">
      {q.data.map((s) => (
        <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="text-sm font-medium text-foreground">{s.query || "Todos os segmentos"} <span className="text-muted-foreground">· {s.location || "Qualquer local"}</span></p>
            <p className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString("pt-BR")} · fonte: {s.source === "workspace" ? "Base do workspace" : s.source} · {s.results_count} resultado(s)</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => onRepeat(s)}>Repetir / ver resultados</Button>
            {s.created_by === userId && (
              <AlertDialog>
                <AlertDialogTrigger asChild><Button size="sm" variant="ghost" aria-label="Excluir pesquisa"><Trash2 className="size-4" /></Button></AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>Excluir pesquisa?</AlertDialogTitle><AlertDialogDescription>As empresas encontradas continuam salvas.</AlertDialogDescription></AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={async () => { try { await deleteSearch(s.id); qc.invalidateQueries({ queryKey: ["searches"] }); toast.success("Pesquisa excluída."); } catch (e) { toast.error(errorText(e)); } }}>Excluir</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
