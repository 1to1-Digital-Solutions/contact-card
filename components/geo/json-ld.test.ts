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
   * `description` es donde schema.org dice a qué se dedica alguien, y es lo que
   * lee un motor de IA cuando le preguntan por él. Va la línea de servicios, la
   * misma que se ve en el panel de datos: el lema promete, pero no dice a qué se
   * dedica nadie.
   */
  it("declara a qué se dedica en `description`", () => {
    expect(schema.description).toBe("Desarrollo de software personalizado");
  });

  it.each(LANGUAGES)("declara a qué se dedica en el idioma servido (%s)", (language) => {
    expect(personSchema(contactIn(language)).description).toBe(
      TRANSLATED.services[language],
    );
  });

  /** La empresa se dedica a lo mismo, y a ella también se le pregunta qué hace. */
  it.each(LANGUAGES)("dice a qué se dedica la empresa (%s)", (language) => {
    expect(personSchema(contactIn(language)).worksFor.description).toBe(
      TRANSLATED.services[language],
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
