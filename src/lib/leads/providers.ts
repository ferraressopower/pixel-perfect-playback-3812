// Lead Provider layer: every data source implements the same contract.
export type ProviderQuery = { country?: string; state?: string; city?: string; neighborhood?: string; segment?: string; keywords?: string; category?: string };
export type LeadProvider = {
  id: string; name: string; available: boolean; reason?: string;
  license?: string; attribution?: string;
};

export const providers: LeadProvider[] = [
  { id: "workspace", name: "Base do workspace", available: true, license: "Dados próprios" },
  { id: "csv", name: "Importação CSV", available: true, license: "Responsabilidade de quem importa" },
  { id: "manual", name: "Cadastro manual", available: true, license: "Dados próprios" },
  { id: "osm", name: "OpenStreetMap", available: false, license: "ODbL (exige atribuição)",
    reason: "Requer um servidor próprio de consulta. O servidor público compartilhado não é usado para buscas comerciais." },
  { id: "commercial", name: "Provedores comerciais", available: false, reason: "Nenhum provedor configurado. APIs pagas estão fora desta etapa." },
];

export const externalProviders = providers.filter((p) => !["workspace","csv","manual"].includes(p.id));
