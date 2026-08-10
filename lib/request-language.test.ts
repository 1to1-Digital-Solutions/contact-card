import { describe, expect, it, vi } from "vitest";
import { DEFAULT_LANGUAGE } from "./i18n";
import { requestLanguage } from "./request-language";

/**
 * `pickLanguage` ya se prueba a fondo con cabeceras de verdad; lo que falta
 * comprobar es el cable, que es donde el fallo no se ve: si el nombre de la
 * cabecera se escribiera mal, `get` devolvería `null` sin quejarse y la página
 * saldría en español para todo el mundo —justo lo que esta tarea venía a
 * arreglar— con los demás tests en verde.
 */

const { headers } = vi.hoisted(() => ({ headers: vi.fn() }));
vi.mock("next/headers", () => ({ headers }));

/** Una petición con las cabeceras que se le pasen. */
function request(init: HeadersInit = {}) {
  headers.mockResolvedValue(new Headers(init));
}

describe("requestLanguage", () => {
  it("sirve el idioma que pide la cabecera del navegador", async () => {
    request({ "Accept-Language": "en-GB,en;q=0.9,es;q=0.8" });
    await expect(requestLanguage()).resolves.toBe("en");
  });

  it("cae en el idioma de recurso cuando la petición no trae cabecera", async () => {
    request();
    await expect(requestLanguage()).resolves.toBe(DEFAULT_LANGUAGE);
  });

  it("cae en el idioma de recurso cuando pide uno que no servimos", async () => {
    request({ "Accept-Language": "ja-JP,ja;q=0.9" });
    await expect(requestLanguage()).resolves.toBe(DEFAULT_LANGUAGE);
  });
});
