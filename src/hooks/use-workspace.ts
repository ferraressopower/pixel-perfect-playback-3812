import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { requireSupabase } from "@/lib/supabase";

export type Workspace = { id: string; name: string; role: "owner" | "admin" | "member" };

// The active workspace is the first membership; multi-workspace switching plugs in here later.
export const workspacesQuery = queryOptions({
  queryKey: ["workspaces"],
  queryFn: async (): Promise<Workspace[]> => {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from("workspace_members")
      .select("role, workspaces(id, name)")
      .order("created_at");
    if (error) throw error;
    return (data ?? []).flatMap((row: any) =>
      row.workspaces ? [{ id: row.workspaces.id, name: row.workspaces.name, role: row.role }] : [],
    );
  },
});

export function useActiveWorkspace(): Workspace | null {
  const { data } = useSuspenseQuery(workspacesQuery);
  return data[0] ?? null;
}
