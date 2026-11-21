import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { AppShell } from "@/components/layout/AppShell";

// Session lives in localStorage, so the gate runs client-side only.
export const Route = createFileRoute("/_app")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    if (!supabase) throw redirect({ to: "/login" });
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login", search: { redirect: location.href } });
    return { user: data.user };
  },
  component: AppLayout,
});

function AppLayout() {
  const { user } = Route.useRouteContext();
  return <AppShell email={user.email ?? null}><Outlet /></AppShell>;
}
