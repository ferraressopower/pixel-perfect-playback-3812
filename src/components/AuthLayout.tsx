import type { ReactNode } from "react";
import panther from "@/assets/panteron-panther.jpg.asset.json";
import { Logo } from "./brand/Logo";
import { SetupNotice } from "./SetupNotice";
import { isSupabaseConfigured } from "@/lib/supabase";

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-background lg:block">
        <img src={panther.url} alt="" className="absolute inset-0 size-full object-cover opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12">
          <p className="wordmark text-xs text-emerald">PANTERON</p>
          <p className="mt-3 max-w-md font-display text-3xl font-semibold leading-tight text-foreground">
            Observe. Rastreie. Encontre a oportunidade antes dos concorrentes.
          </p>
        </div>
      </div>
      <div className="auth-backdrop flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Logo className="mb-10" />
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          {!isSupabaseConfigured && <div className="mt-6"><SetupNotice /></div>}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
