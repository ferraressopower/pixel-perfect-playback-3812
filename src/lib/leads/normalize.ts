// Pure helpers for lead data: normalization, duplicate detection, WhatsApp, website status.
export type WebsiteStatus = "has_site" | "confirmed_none" | "not_informed" | "unverified";

export function normalizeName(name: string | null | undefined): string {
  return (name ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/\b(ltda|me|eireli|epp|s\/?a|mei)\b/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

export function normalizePhone(phone: string | null | undefined): string {
  let d = (phone ?? "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("0") && (d.length === 11 || d.length === 12)) d = d.slice(1);
  if (d.length === 10 || d.length === 11) d = "55" + d;
  return d;
}

export function normalizeDomain(url: string | null | undefined): string {
  const v = (url ?? "").trim().toLowerCase();
  if (!v) return "";
  try {
    const u = new URL(/^https?:\/\//.test(v) ? v : `https://${v}`);
    return u.hostname.replace(/^www\./, "");
  } catch { return ""; }
}

/** wa.me link only for a plausible Brazilian (55 + DDD + 8/9 digits) or international number. */
export function whatsappLink(phone: string | null | undefined): string | null {
  const d = normalizePhone(phone);
  if (d.startsWith("55")) { if (d.length !== 12 && d.length !== 13) return null; }
  else if (d.length < 11 || d.length > 15) return null;
  return `https://wa.me/${d}`;
}

export function websiteHref(url: string | null | undefined): string | null {
  const dom = normalizeDomain(url);
  if (!dom || !dom.includes(".")) return null;
  const v = (url ?? "").trim();
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

/** An empty website field never means "no site" by itself. */
export function deriveWebsiteStatus(website: string | null | undefined, explicit?: WebsiteStatus | null): WebsiteStatus {
  if (websiteHref(website)) return "has_site";
  if (explicit && explicit !== "has_site") return explicit;
  return "not_informed";
}

export type DupKey = { id?: string; normalized_name?: string | null; normalized_phone?: string | null; normalized_domain?: string | null };
export type DupReason = "telefone" | "website" | "nome";

/** Same phone or same domain = duplicate. Same normalized name alone also flags, but only exact matches. */
export function duplicateReason(a: DupKey, b: DupKey): DupReason | null {
  if (a.normalized_phone && a.normalized_phone === b.normalized_phone) return "telefone";
  if (a.normalized_domain && a.normalized_domain === b.normalized_domain) return "website";
  if (a.normalized_name && a.normalized_name.length > 2 && a.normalized_name === b.normalized_name) return "nome";
  return null;
}

export function findDuplicate<T extends DupKey>(row: DupKey, pool: T[]): { match: T; reason: DupReason } | null {
  for (const p of pool) { const r = duplicateReason(row, p); if (r) return { match: p, reason: r }; }
  return null;
}

/** Neutralize spreadsheet formula injection (=, +, -, @, tab, CR) when values are exported again. */
export function sanitizeCell(v: unknown): string {
  const s = String(v ?? "").replace(/\u0000/g, "").trim().slice(0, 2000);
  return /^[=+\-@\t\r]/.test(s) && !/^[+-]?\d[\d\s().-]*$/.test(s) ? `'${s}` : s;
}
