import { describe, expect, it } from "vitest";
import { type Contact, contactIn, JOB_TITLE } from "./contact";
import { LANGUAGES } from "./i18n";
import { buildVCard, escapeVCardValue, vCardFilename } from "./vcard";

/** La vCard se comprueba en español; el cargo, además, en los dos idiomas. */
const CONTACT = contactIn("es");

describe("escapeVCardValue", () => {
  it("escapa los separadores del estándar", () => {
    expect(escapeVCardValue("Acme; S.L., Madrid")).toBe(
      "Acme\\; S.L.\\, Madrid",
    );
  });

  it("escapa la barra invertida sin duplicar los escapes que introduce", () => {
    expect(escapeVCardValue("a\\b;c")).toBe("a\\\\b\\;c");
  });

  it("convierte los saltos de línea en la secuencia literal \\n", () => {
    expect(escapeVCardValue("línea 1\r\nlínea 2")).toBe("línea 1\\nlínea 2");
  });

  it("deja intacto un valor sin caracteres especiales", () => {
    expect(escapeVCardValue("cesarpl@1to1digital.solutions")).toBe(
      "cesarpl@1to1digital.solutions",
    );
  });
});

describe("buildVCard", () => {
  const vcard = buildVCard(CONTACT);
  const lines = vcard.split("\r\n");

  it("abre y cierra la tarjeta y declara la versión", () => {
    expect(lines[0]).toBe("BEGIN:VCARD");
    expect(lines[1]).toBe("VERSION:3.0");
    expect(lines.at(-2)).toBe("END:VCARD");
  });

  it("termina todas las líneas con CRLF, como exige el estándar", () => {
    expect(vcard.endsWith("\r\n")).toBe(true);
    expect(vcard.replace(/\r\n/g, "")).not.toContain("\n");
  });

  it("estructura el nombre como apellidos;nombre y sin los campos opcionales", () => {
    expect(lines).toContain("N:Peón Lamparero;César;;;");
    expect(lines).toContain("FN:César Peón Lamparero");
  });

  it("incluye email, teléfono en E.164, empresa y web", () => {
    expect(lines).toContain("EMAIL;TYPE=INTERNET,WORK:cesarpl@1to1digital.solutions");
    expect(lines).toContain("TEL;TYPE=CELL,WORK:+34685399864");
    expect(lines).toContain("ORG:1to1 Digital Solutions");
    expect(lines).toContain("URL:https://1to1digital.solutions");
  });

  /** `TITLE` es el campo del cargo en el estándar; es lo que leen las agendas. */
  it("lleva el cargo en TITLE", () => {
    expect(lines).toContain("TITLE:Desarrollador full-stack");
  });

  /**
   * Quien guarda la tarjeta se queda el cargo en su agenda para siempre: si no
   * saliera en el idioma en el que la está leyendo, se lo lleva en uno ajeno.
   */
  it.each(LANGUAGES)("guarda el cargo en el idioma servido (%s)", (language) => {
    expect(buildVCard(contactIn(language)).split("\r\n")).toContain(
      `TITLE:${JOB_TITLE[language]}`,
    );
  });

  it("escapa los datos de entrada en lugar de romper el formato", () => {
    const conflictivo: Contact = {
      ...CONTACT,
      company: "Acme; S.L., Madrid",
    };
    expect(buildVCard(conflictivo).split("\r\n")).toContain(
      "ORG:Acme\\; S.L.\\, Madrid",
    );
  });
});

describe("vCardFilename", () => {
  it("genera un nombre de fichero sin acentos ni espacios", () => {
    expect(vCardFilename(CONTACT)).toBe("cesar-peon-lamparero.vcf");
  });

  it("no deja guiones sobrantes en los extremos", () => {
    expect(vCardFilename({ ...CONTACT, name: "  ¡Ada Lovelace!  " })).toBe(
      "ada-lovelace.vcf",
    );
  });
});
