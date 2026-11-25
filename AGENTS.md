<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Backend is an external, user-owned Supabase project — never Lovable Cloud. Client lives in `src/lib/supabase.ts` using `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`; schema SQL lives in `docs/sql/` for the user to run. Why: user explicitly forbids Lovable-managed infra.
- Multi-tenant: every private table carries `workspace_id` and RLS via `is_workspace_member()`. Why: tenant isolation must be enforced in the database, not the UI.
- Signed-in areas live under the pathless `src/routes/_app/` layout (`ssr: false`, client session gate). Why: session is in localStorage.
- Unbuilt modules render honest empty states, never fake data. Why: user requirement.
- Company finder logic lives in `src/lib/leads/` (pure rules in `normalize.ts`/`csv.ts`, Supabase calls in `queries.ts`, sources in `providers.ts`); UI in `src/components/leads/`. Why: external data sources plug into the provider layer without touching UI.
- An empty website never means "no site": `website_status` distinguishes has_site / confirmed_none / not_informed / unverified. Why: user requirement for honest prospect data.
