import type { WebsiteStatus } from "./normalize";

export const LEAD_STATUSES = [
  { value: "novo", label: "Novo lead" }, { value: "nao_contatado", label: "Não contatado" },
  { value: "contatado", label: "Contatado" }, { value: "negociacao", label: "Em negociação" },
  { value: "cliente", label: "Cliente conquistado" }, { value: "sem_interesse", label: "Sem interesse" },
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number]["value"];
export const statusLabel = (s: string) => LEAD_STATUSES.find((x) => x.value === s)?.label ?? s;

export type Lead = {
  id: string; workspace_id: string; company_name: string; segment: string | null;
  country: string | null; state: string | null; city: string | null; neighborhood: string | null; address: string | null;
  phone: string | null; email: string | null; website_url: string | null; website_status: WebsiteStatus;
  description: string | null; source: string | null; source_url: string | null; status: LeadStatus;
  notes: string | null; saved_to_crm: boolean; created_at: string; updated_at: string;
  normalized_name: string | null; normalized_phone: string | null; normalized_domain: string | null;
};

export type LeadInput = {
  company_name: string; segment?: string; country?: string; state?: string; city?: string; neighborhood?: string;
  address?: string; phone?: string; email?: string; website_url?: string; website_status?: WebsiteStatus;
  description?: string; source?: string; source_url?: string; notes?: string; status?: LeadStatus;
};
