import { describe, expect, it } from "vitest";
import { CONTACT } from "./contact";

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
