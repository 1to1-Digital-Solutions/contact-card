import { describe, expect, it } from "vitest";
import { type Contact, contactIn, PROFILES, TRANSLATED } from "./contact";
import { LANGUAGES } from "./i18n";
import { buildVCard, escapeVCardValue, vCardFilename } from "./vcard";

/** The vCard is checked in Spanish; the job title, additionally, in both languages. */
const CONTACT = contactIn("es");

describe("escapeVCardValue", () => {
  it("escapes the standard's separators", () => {
    expect(escapeVCardValue("Acme; S.L., Madrid")).toBe(
      "Acme\; S.L.\\, Madrid",
    );
  });

  it("escapes the backslash without doubling the escapes it introduces", () => {
    expect(escapeVCardValue("a\\b;c")).toBe("a\\\\b\;c");
  });

  it("turns line breaks into the literal \\n sequence", () => {
    expect(escapeVCardValue("línea 1\r\nlínea 2")).toBe("línea 1\\nlínea 2");
  });

  it("leaves a value without special characters untouched", () => {
    expect(escapeVCardValue("cesarpl@1to1digital.solutions")).toBe(
      "cesarpl@1to1digital.solutions",
    );
  });
});

describe("buildVCard", () => {
  const vcard = buildVCard(CONTACT);
  const lines = vcard.split("\r\n");

  it("opens and closes the card and declares the version", () => {
    expect(lines[0]).toBe("BEGIN:VCARD");
    expect(lines[1]).toBe("VERSION:3.0");
    expect(lines.at(-2)).toBe("END:VCARD");
  });

  it("ends every line with CRLF, as the standard requires", () => {
    expect(vcard.endsWith("\r\n")).toBe(true);
    expect(vcard.replace(/\r\n/g, "")).not.toContain("\n");
  });

  it("structures the name as surname;given name and without the optional fields", () => {
    expect(lines).toContain("N:Peón Lamparero;César;;;");
    expect(lines).toContain("FN:César Peón Lamparero");
  });

  it("includes email, phone in E.164, company and website", () => {
    expect(lines).toContain("EMAIL;TYPE=INTERNET,WORK:cesarpl@1to1digital.solutions");
    expect(lines).toContain("TEL;TYPE=CELL,WORK:+34685399864");
    expect(lines).toContain("ORG:1to1 Digital Solutions");
    expect(lines).toContain("URL:https://1to1digital.solutions");
  });

  /**
   * The profiles are left out on purpose: the address book stores ways of
   * getting in touch, not links to social networks. Since they come from the
   * same source as the rest of the data, dropping them in here as `URL:` is
   * the natural slip, and whoever saved the card would carry links they never
   * asked for forever.
   */
  it("does not carry the profiles into the address book, as they are not ways of contact", () => {
    for (const { url, address } of PROFILES) {
      expect(vcard).not.toContain(url);
      expect(vcard).not.toContain(address);
    }
  });

  /** `TITLE` is the standard's field for the job title; it is what address books read. */
  it("carries the job title in TITLE", () => {
    expect(lines).toContain("TITLE:Desarrollador full-stack");
  });

  /**
   * Whoever saves the card keeps the job title in their address book forever:
   * if it did not come out in the language they are reading it in, they would
   * take it away in a foreign one.
   */
  it.each(LANGUAGES)("stores the job title in the served language (%s)", (language) => {
    expect(buildVCard(contactIn(language)).split("\r\n")).toContain(
      `TITLE:${TRANSLATED.jobTitle[language]}`,
    );
  });

  /**
   * The tagline and what the business does do not go into the address book
   * either: they are the card's pitch, not a way of getting in touch, and on a
   * contact record they would end up as filler in the only free field there
   * is. Since `contactIn` brings them along with the rest of the data,
   * slipping them in here is the natural slip.
   */
  it.each(LANGUAGES)("does not carry the tagline or the services into the address book (%s)", (language) => {
    const vcard = buildVCard(contactIn(language));
    expect(vcard).not.toContain(TRANSLATED.tagline[language]);
    expect(vcard).not.toContain(TRANSLATED.services[language]);
  });

  it("escapes the input data instead of breaking the format", () => {
    const conflicting: Contact = {
      ...CONTACT,
      company: "Acme; S.L., Madrid",
    };
    expect(buildVCard(conflicting).split("\r\n")).toContain(
      "ORG:Acme\; S.L.\\, Madrid",
    );
  });
});

describe("vCardFilename", () => {
  it("generates a file name without accents or spaces", () => {
    expect(vCardFilename(CONTACT)).toBe("cesar-peon-lamparero.vcf");
  });

  it("leaves no stray hyphens at the ends", () => {
    expect(vCardFilename({ ...CONTACT, name: "  ¡Ada Lovelace!  " })).toBe(
      "ada-lovelace.vcf",
    );
  });
});
