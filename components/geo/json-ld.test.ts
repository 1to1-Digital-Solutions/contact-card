import { describe, expect, it } from "vitest";
import { personSchema } from "./json-ld";

/**
 * Los datos estructurados son lo que leen los buscadores y los motores de IA, y
 * no se ven en la página: si un campo se cae o se nombra mal, nadie lo nota. Se
 * comprueban los nombres exactos de schema.org, que son el contrato.
 */
describe("personSchema", () => {
  const schema = personSchema();

  it("describe a una persona de schema.org", () => {
    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("Person");
  });

  it("declara el cargo en `jobTitle`, que es la propiedad del estándar", () => {
    expect(schema.jobTitle).toBe("Desarrollador full-stack");
  });
});
