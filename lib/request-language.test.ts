import { describe, expect, it, vi } from "vitest";
import { DEFAULT_LANGUAGE, LANGUAGE_COOKIE } from "./i18n";
import { requestLanguage } from "./request-language";

/**
 * `pickLanguage` ya se prueba a fondo con cabeceras de verdad; lo que falta
 * comprobar es el cable, que es donde el fallo no se ve: si el nombre de la
 * cabecera o el de la cookie se escribieran mal, `get` devolvería `null` sin
 * quejarse y la página saldría en español para todo el mundo —justo lo que
 * esta tarea venía a arreglar— con los demás tests en verde.
 */

const { cookies, headers } = vi.hoisted(() => ({ cookies: vi.fn(), headers: vi.fn() }));
vi.mock("next/headers", () => ({ cookies, headers }));

/** Una petición con las cabeceras y la cookie de idioma que se le pasen. */
function request({ header, cookie }: { header?: string; cookie?: string } = {}) {
  headers.mockResolvedValue(new Headers(header ? { "Accept-Language": header } : {}));
  cookies.mockResolvedValue({
    get: (name: string) =>
      cookie !== undefined && name === LANGUAGE_COOKIE ? { name, value: cookie } : undefined,
  });
}

describe("requestLanguage", () => {
  it("sirve el idioma que pide la cabecera del navegador", async () => {
    request({ header: "en-GB,en;q=0.9,es;q=0.8" });
    await expect(requestLanguage()).resolves.toBe("en");
  });

  it("cae en el idioma de recurso cuando la petición no trae cabecera", async () => {
    request();
    await expect(requestLanguage()).resolves.toBe(DEFAULT_LANGUAGE);
  });

  it("cae en el idioma de recurso cuando pide uno que no servimos", async () => {
    request({ header: "ja-JP,ja;q=0.9" });
    await expect(requestLanguage()).resolves.toBe(DEFAULT_LANGUAGE);
  });

  /**
   * La elección del conmutador es más explícita que la cabecera: quien pulsó
   * el botón dijo en qué idioma quiere la tarjeta y el navegador solo dice en
   * cuáles sabe leer. Si la cabecera ganara, la elección duraría lo que dura
   * la visita, que es justo lo que había antes de recordarla.
   */
  it("sirve el idioma recordado aunque el navegador pida el otro", async () => {
    request({ header: "es-ES,es;q=0.9", cookie: "en" });
    await expect(requestLanguage()).resolves.toBe("en");

    request({ header: "en-US,en;q=0.9", cookie: "es" });
    await expect(requestLanguage()).resolves.toBe("es");
  });

  it("sirve el idioma recordado cuando la petición no trae cabecera", async () => {
    request({ cookie: "en" });
    await expect(requestLanguage()).resolves.toBe("en");
  });

  /**
   * Una cookie la escribe cualquiera: otra página del dominio, una extensión o
   * la propia consola. Si no se valida, un valor inventado se colaría hasta el
   * diccionario y dejaría la página sin textos.
   */
  it.each(["", "de", "es-ES", "EN", "null", "<script>"])(
    "ignora la cookie con un valor que no servimos (%s) y negocia con la cabecera",
    async (cookie) => {
      request({ header: "en-GB,en;q=0.9", cookie });
      await expect(requestLanguage()).resolves.toBe("en");
    },
  );
});
