import { describe, expect, it } from "vitest";
import { contactIn, PROFILES, TRANSLATED } from "@/lib/contact";
import { LANGUAGES } from "@/lib/i18n";
import { personSchema } from "./json-ld";

/**
 * Los datos estructurados son lo que leen los buscadores y los motores de IA, y
 * no se ven en la página: si un campo se cae o se nombra mal, nadie lo nota. Se
 * comprueban los nombres exactos de schema.org, que son el contrato.
 */
describe("personSchema", () => {
  const schema = personSchema(contactIn("es"));

  it("describe a una persona de schema.org", () => {
    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("Person");
  });

  it("declara el cargo en `jobTitle`, que es la propiedad del estándar", () => {
    expect(schema.jobTitle).toBe("Desarrollador full-stack");
  });

  /**
   * El cargo del JSON-LD tiene que ir en el idioma que se está sirviendo: la
   * página lo anuncia en `<html lang>` y una ficha que dijera otra cosa le
   * estaría contando al buscador un idioma que no es.
   */
  it.each(LANGUAGES)("declara el cargo en el idioma servido (%s)", (language) => {
    expect(personSchema(contactIn(language)).jobTitle).toBe(
      TRANSLATED.jobTitle[language],
    );
  });

  /**
   * `sameAs` es la propiedad con la que se dice que la persona de la ficha es
   * también la de esos perfiles. Sin ella, la página y el LinkedIn de César son
   * dos desconocidos para quien la lee.
   */
  it("declara los perfiles públicos en `sameAs`", () => {
    expect(schema.sameAs).toEqual(PROFILES.map((profile) => profile.url));
    expect(schema.sameAs.map((url) => new URL(url).host).sort()).toEqual([
      "github.com",
      "www.linkedin.com",
    ]);
  });
});
