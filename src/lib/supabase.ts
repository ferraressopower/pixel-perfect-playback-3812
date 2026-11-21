import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// External Supabase project (not Lovable Cloud). Only the public anon key lives in the browser.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
      },
    })
  : null;

export function requireSupabase(): SupabaseClient {
  if (!supabase) throw new Error("Supabase não configurado");
  return supabase;
}
