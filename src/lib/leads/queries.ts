import { requireSupabase } from "@/lib/supabase";
import { deriveWebsiteStatus, normalizeDomain, normalizeName, normalizePhone, type DupKey } from "./normalize";
import type { Lead, LeadInput } from "./types";

export const PAGE_SIZE = 25;
export type LeadFilter = "all" | "with_site" | "no_site" | "with_phone" | "with_address" | "with_email";
export type LeadListParams = {
  workspaceId: string; page: number; q: string; filter: LeadFilter;
  sort: keyof Lead; asc: boolean;
  country?: string; state?: string; city?: string; neighborhood?: string; segment?: string; keywords?: string; searchId?: string;
};

/** Escape a user term for PostgREST ilike/or filters. */
const esc = (s: string) => s.replace(/[%_,()*\\]/g, " ").trim();

export async function listLeads(p: LeadListParams) {
  const sb = requireSupabase();
  let q = sb.from("leads").select("*", { count: "exact" }).eq("workspace_id", p.workspaceId);
  for (const [col, v] of [["country", p.country], ["state", p.state], ["city", p.city], ["neighborhood", p.neighborhood], ["segment", p.segment]] as const) {
    if (v && esc(v)) q = q.ilike(col, `%${esc(v)}%`);
  }
  for (const term of [p.keywords, p.q]) {
    const t = term && esc(term);
    if (t) q = q.or(`company_name.ilike.%${t}%,segment.ilike.%${t}%,description.ilike.%${t}%,city.ilike.%${t}%,phone.ilike.%${t}%,email.ilike.%${t}%`);
  }
  if (p.searchId) q = q.eq("search_id", p.searchId);
  if (p.filter === "with_site") q = q.eq("website_status", "has_site");
  if (p.filter === "no_site") q = q.eq("website_status", "confirmed_none");
  if (p.filter === "with_phone") q = q.not("phone", "is", null).neq("phone", "");
  if (p.filter === "with_address") q = q.not("address", "is", null).neq("address", "");
  if (p.filter === "with_email") q = q.not("email", "is", null).neq("email", "");
  const from = p.page * PAGE_SIZE;
  const { data, count, error } = await q.order(p.sort, { ascending: p.asc, nullsFirst: false }).range(from, from + PAGE_SIZE - 1);
  if (error) throw error;
  return { rows: (data ?? []) as Lead[], total: count ?? 0 };
}

export function toRow(input: LeadInput, workspaceId: string) {
  const clean = (v?: string) => (v ?? "").trim() || null;
  return {
    workspace_id: workspaceId,
    company_name: input.company_name.trim(),
    segment: clean(input.segment), country: clean(input.country), state: clean(input.state), city: clean(input.city),
    neighborhood: clean(input.neighborhood), address: clean(input.address), phone: clean(input.phone),
    email: clean(input.email), website_url: clean(input.website_url),
    website_status: deriveWebsiteStatus(input.website_url, input.website_status),
    has_website: deriveWebsiteStatus(input.website_url, input.website_status) === "has_site" ? true
      : input.website_status === "confirmed_none" ? false : null,
    description: clean(input.description), source: clean(input.source), source_url: clean(input.source_url),
    notes: clean(input.notes), ...(input.status ? { status: input.status } : {}),
    normalized_name: normalizeName(input.company_name) || null,
    normalized_phone: normalizePhone(input.phone) || null,
    normalized_domain: normalizeDomain(input.website_url) || null,
  };
}

/** Fetch existing leads that could collide with any of the given keys (same workspace only). */
export async function fetchDupCandidates(workspaceId: string, keys: DupKey[]) {
  const sb = requireSupabase();
  const pick = (k: keyof DupKey) => [...new Set(keys.map((x) => x[k]).filter((v): v is string => !!v))];
  const out: (DupKey & { id: string; company_name: string })[] = [];
  const cols = ["normalized_name", "normalized_phone", "normalized_domain"] as const;
  for (const col of cols) {
    const vals = pick(col);
    for (let i = 0; i < vals.length; i += 200) {
      const { data, error } = await sb.from("leads").select("id, company_name, normalized_name, normalized_phone, normalized_domain")
        .eq("workspace_id", workspaceId).in(col, vals.slice(i, i + 200));
      if (error) throw error;
      out.push(...(data ?? []));
    }
  }
  return out;
}

export async function insertLeads(rows: ReturnType<typeof toRow>[] & { raw_data?: unknown }[]) {
  const sb = requireSupabase();
  let n = 0;
  for (let i = 0; i < rows.length; i += 200) {
    const { error, count } = await sb.from("leads").insert(rows.slice(i, i + 200), { count: "exact" });
    if (error) throw error;
    n += count ?? 0;
  }
  return n;
}

export async function updateLead(id: string, patch: Record<string, unknown>) {
  const { error } = await requireSupabase().from("leads").update(patch).eq("id", id);
  if (error) throw error;
}
export async function deleteLead(id: string) {
  const { error } = await requireSupabase().from("leads").delete().eq("id", id);
  if (error) throw error;
}
export async function saveToCrm(ids: string[]) {
  const { error } = await requireSupabase().from("leads").update({ saved_to_crm: true }).in("id", ids);
  if (error) throw error;
}

export async function leadEvents(leadId: string) {
  const { data, error } = await requireSupabase().from("lead_events").select("*").eq("lead_id", leadId).order("created_at", { ascending: false }).limit(50);
  if (error) throw error;
  return data ?? [];
}

export type SearchRow = { id: string; query: string; location: string | null; filters: any; results_count: number; source: string; created_by: string | null; created_at: string };
export async function listSearches(workspaceId: string) {
  const { data, error } = await requireSupabase().from("searches").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(100);
  if (error) throw error;
  return (data ?? []) as SearchRow[];
}
export async function recordSearch(workspaceId: string, userId: string, query: string, location: string, filters: object, count: number) {
  const { error } = await requireSupabase().from("searches").insert({ workspace_id: workspaceId, created_by: userId, query, location, filters, results_count: count, source: "workspace", status: "completed" });
  if (error) throw error;
}
export async function deleteSearch(id: string) {
  const { error } = await requireSupabase().from("searches").delete().eq("id", id);
  if (error) throw error;
}

/** True when the 0002 migration has been applied. */
export async function schemaReady(): Promise<boolean> {
  const { error } = await requireSupabase().from("lead_events").select("id", { head: true, count: "exact" }).limit(1);
  return !error;
}

export function errorText(e: unknown): string {
  const m = (e as any)?.message ?? String(e);
  if (/row-level security/i.test(m)) return "Sem permissão para esta ação neste workspace.";
  if (/column .* does not exist|schema cache/i.test(m)) return "Banco desatualizado: rode o arquivo 0002 no Supabase.";
  return m;
}
