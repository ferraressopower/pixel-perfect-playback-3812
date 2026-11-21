import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Menu } from "lucide-react";
import { navGroups } from "@/lib/nav";
import { Logo } from "@/components/brand/Logo";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/lib/supabase";

function SidebarNav({ email, onNavigate }: { email: string | null; onNavigate?: () => void }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase?.auth.signOut();
    navigate({ to: "/login", replace: true });
  }
  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex h-16 items-center border-b border-sidebar-border px-5"><Logo /></div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {navGroups.map((g) => (
          <div key={g.label}>
            <p className="mb-2 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">{g.label}</p>
            <ul className="space-y-0.5">
              {g.items.map((it) => (
                <li key={it.to}>
                  <Link to={it.to} onClick={onNavigate}
                    className="group flex items-center gap-3 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}>
                    {({ isActive }) => (<>
                      <it.icon className={isActive ? "size-4 text-emerald" : "size-4"} />
                      {it.label}
                    </>)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center justify-between gap-2 rounded-md px-2 py-2">
          <span className="truncate text-xs text-muted-foreground">{email}</span>
          <button onClick={signOut} aria-label="Sair" className="rounded p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground">
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ email, children }: { email: string | null; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-sidebar-border lg:block">
        <SidebarNav email={email} />
      </aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 border-sidebar-border p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SidebarNav email={email} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur lg:hidden">
        <button onClick={() => setOpen(true)} aria-label="Abrir menu" className="rounded p-1.5 hover:bg-accent"><Menu className="size-5" /></button>
        <Logo />
      </header>
      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10 animate-in fade-in duration-200">{children}</div>
      </main>
    </div>
  );
}
