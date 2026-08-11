import { describe, expect, it } from "vitest";
import { CONTACT, PROFILES } from "./contact";

/**
 * `lib/contact.ts` guarda cada dato dos veces —el teléfono legible y su
 * E.164, el dominio y su URL, el nombre entero y sus partes— porque cada
 * versión la consume un sitio distinto (la tarjeta, la vCard, los enlaces).
 * Al editarlo es fácil cambiar una y olvidar la otra: el `tel:` marcaría un
 * número viejo sin que se note. Estas comprobaciones cierran ese hueco.
 */
describe("CONTACT", () => {
  it("mantiene el mismo teléfono en las dos formas", () => {
    expect(CONTACT.phoneE164).toBe(CONTACT.phone.replace(/[\s.()-]/g, ""));
  });

  it("guarda el teléfono en E.164 válido, que es lo que exige la vCard", () => {
    expect(CONTACT.phoneE164).toMatch(/^\+[1-9]\d{7,14}$/);
  });

  it("apunta la URL de la web al dominio que se muestra", () => {
    const url = new URL(CONTACT.websiteUrl);
    expect(url.protocol).toBe("https:");
    expect(url.host).toBe(CONTACT.website);
  });

  it("compone el nombre visible con el nombre y los apellidos de la vCard", () => {
    expect(CONTACT.name).toBe(`${CONTACT.givenName} ${CONTACT.familyName}`);
  });

  it("tiene un email con una pinta razonable", () => {
    expect(CONTACT.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });
});

/**
 * Cada perfil también se guarda dos veces —la dirección que se lee y la URL a
 * la que lleva— y el mismo descuido de siempre haría que el enlace fuera a un
 * sitio distinto del que anuncia. Además, la ruta de LinkedIn lleva los acentos
 * percent-encoded: escribirlos tal cual deja escrita una URL que no es la
 * canónica del perfil.
 */
describe("PROFILES", () => {
  it("enlaza los perfiles que se enseñan, y solo esos", () => {
    expect(PROFILES.map((profile) => profile.name)).toEqual(["LinkedIn", "GitHub"]);
  });

  it.each(PROFILES)("lleva a $name por https", ({ url }) => {
    expect(new URL(url).protocol).toBe("https:");
  });

  it.each(PROFILES)("guarda la URL de $name ya codificada", ({ url }) => {
    // `href` normaliza: si la URL se escribiera con los acentos literales, la
    // forma canónica no coincidiría con lo que hay escrito aquí.
    expect(url).toBe(new URL(url).href);
  });

  it.each(PROFILES)("enseña de $name la dirección a la que lleva", ({ address, url }) => {
    const { host, pathname } = new URL(url);
    const shown = decodeURI(`${host}${pathname}`)
      .replace(/^www\./, "")
      .replace(/\/$/, "");
    expect(shown).toBe(address);
  });
});
