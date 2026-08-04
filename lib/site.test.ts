import { describe, expect, it } from "vitest";
import { CONTACT } from "./contact";
import { resolveSiteUrl } from "./site";

describe("resolveSiteUrl", () => {
  it("usa la web del contacto cuando no hay variable definida", () => {
    expect(resolveSiteUrl(undefined)).toBe(CONTACT.websiteUrl);
    expect(resolveSiteUrl("")).toBe(CONTACT.websiteUrl);
  });

  it("se queda con el origen y descarta ruta, query y hash", () => {
    expect(resolveSiteUrl("https://preview.vercel.app/ruta?a=1#x")).toBe(
      "https://preview.vercel.app",
    );
  });

  it("cae al valor por defecto si la variable no es una URL válida", () => {
    expect(resolveSiteUrl("no-es-una-url")).toBe(CONTACT.websiteUrl);
  });
});
