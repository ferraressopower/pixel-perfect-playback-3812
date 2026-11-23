import { describe, expect, it } from "vitest";
import { deriveWebsiteStatus, duplicateReason, normalizeDomain, normalizeName, normalizePhone, sanitizeCell, whatsappLink } from "./normalize";
import { applyMap, autoMap, parseCsv, validateRow } from "./csv";

describe("leads rules", () => {
  it("builds WhatsApp link for a valid BR mobile", () => {
    expect(whatsappLink("(11) 98765-4321")).toBe("https://wa.me/5511987654321");
  });
  it("refuses WhatsApp for a too-short number", () => {
    expect(whatsappLink("1234")).toBeNull();
  });
  it("empty website is 'not informed', never 'no site'", () => {
    expect(deriveWebsiteStatus("")).toBe("not_informed");
    expect(deriveWebsiteStatus("", "confirmed_none")).toBe("confirmed_none");
    expect(deriveWebsiteStatus("www.x.com.br")).toBe("has_site");
  });
  it("detects duplicates by phone and domain", () => {
    expect(duplicateReason({ normalized_phone: normalizePhone("11 3333-4444") }, { normalized_phone: normalizePhone("+55 (11) 3333-4444") })).toBe("telefone");
    expect(duplicateReason({ normalized_domain: normalizeDomain("https://www.a.com/x") }, { normalized_domain: normalizeDomain("a.com") })).toBe("website");
  });
  it("similar but different names are not duplicates", () => {
    expect(duplicateReason({ normalized_name: normalizeName("Pizzaria Bella") }, { normalized_name: normalizeName("Pizzaria Bella Napoli") })).toBeNull();
    expect(duplicateReason({ normalized_name: normalizeName("Clínica Sorriso LTDA") }, { normalized_name: normalizeName("clinica sorriso") })).toBe("nome");
  });
  it("neutralizes formulas but keeps phone numbers", () => {
    expect(sanitizeCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(sanitizeCell("+55 11 9999-0000")).toBe("+55 11 9999-0000");
  });
  it("maps Portuguese headers and validates rows", () => {
    const { headers, rows } = parseCsv("Nome,Cidade,Telefone\nPet Feliz,Campinas,19 99999-0000\n,Santos,\n");
    const m = autoMap(headers);
    expect(m.company_name).toBe("Nome");
    expect(validateRow(applyMap(rows[0]!, m))).toBeNull();
    expect(validateRow(applyMap(rows[1]!, m))).toBe("Sem nome da empresa");
  });
});
