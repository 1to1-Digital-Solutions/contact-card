import { describe, expect, it } from "vitest";
import { contactIn, JOB_TITLE } from "@/lib/contact";
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
    expect(personSchema(contactIn(language)).jobTitle).toBe(JOB_TITLE[language]);
  });
});
