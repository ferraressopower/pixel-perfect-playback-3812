import Papa from "papaparse";
import { sanitizeCell } from "./normalize";

export const CSV_FIELDS = ["company_name","category","country","state","city","neighborhood","address","phone","email","website","description","source"] as const;
export type CsvField = (typeof CSV_FIELDS)[number];
export const CSV_LABELS: Record<CsvField, string> = {
  company_name: "Nome da empresa", category: "Categoria", country: "País", state: "Estado", city: "Cidade",
  neighborhood: "Bairro", address: "Endereço", phone: "Telefone", email: "Email", website: "Website",
  description: "Descrição", source: "Fonte",
};
const ALIASES: Record<CsvField, string[]> = {
  company_name: ["company_name","nome","empresa","name","razao social","nome da empresa","nome fantasia"],
  category: ["category","categoria","segmento","nicho"], country: ["country","pais"], state: ["state","estado","uf"],
  city: ["city","cidade","municipio"], neighborhood: ["neighborhood","bairro"], address: ["address","endereco","logradouro"],
  phone: ["phone","telefone","fone","celular","whatsapp"], email: ["email","e-mail"], website: ["website","site","url"],
  description: ["description","descricao","observacao"], source: ["source","fonte","origem"],
};
export const MAX_CSV_BYTES = 5 * 1024 * 1024;
export const MAX_CSV_ROWS = 5000;

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[_-]+/g, " ").trim();

export function templateCsv(): string {
  return CSV_FIELDS.join(",") + "\n";
}

export function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const r = Papa.parse<Record<string, string>>(text.replace(/^\uFEFF/, ""), { header: true, skipEmptyLines: "greedy" });
  const headers = (r.meta.fields ?? []).filter(Boolean);
  return { headers, rows: r.data.slice(0, MAX_CSV_ROWS) };
}

export function autoMap(headers: string[]): Partial<Record<CsvField, string>> {
  const m: Partial<Record<CsvField, string>> = {};
  for (const f of CSV_FIELDS) {
    const h = headers.find((x) => ALIASES[f].some((a) => norm(a) === norm(x)));
    if (h) m[f] = h;
  }
  return m;
}

export function applyMap(row: Record<string, string>, map: Partial<Record<CsvField, string>>): Record<CsvField, string> {
  const out = {} as Record<CsvField, string>;
  for (const f of CSV_FIELDS) out[f] = map[f] ? sanitizeCell(row[map[f]!]) : "";
  return out;
}

export function validateRow(r: Record<CsvField, string>): string | null {
  if (!r.company_name) return "Sem nome da empresa";
  if (r.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)) return "Email inválido";
  return null;
}
