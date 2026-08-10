import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE,
  type Language,
  LANGUAGES,
  nextLanguage,
  parseLanguage,
  pickLanguage,
  rememberLanguage,
} from "./i18n";

/**
 * La cabecera `Accept-Language` es lo único que decide en qué idioma llega la
 * tarjeta, y llega una sola vez: no hay segunda oportunidad en el cliente. La
 * escriben navegadores muy distintos —con regiones, con pesos, con comodines
 * y a veces mal—, así que aquí se prueba con lo que mandan de verdad.
 */
describe("pickLanguage", () => {
  it("sirve el idioma de recurso cuando no hay cabecera", () => {
    expect(pickLanguage(null)).toBe(DEFAULT_LANGUAGE);
    expect(pickLanguage(undefined)).toBe(DEFAULT_LANGUAGE);
    expect(pickLanguage("")).toBe(DEFAULT_LANGUAGE);
  });

  it("sirve el idioma de recurso cuando no se pide ninguno de los nuestros", () => {
    expect(pickLanguage("de-DE,de;q=0.9,it;q=0.8")).toBe("es");
  });

  it("entiende una cabecera simple, con o sin región", () => {
    expect(pickLanguage("en")).toBe("en");
    expect(pickLanguage("en-GB")).toBe("en");
    expect(pickLanguage("es-419")).toBe("es");
  });

  it("no distingue mayúsculas ni se atraganta con los espacios", () => {
    expect(pickLanguage("EN-US, es;q=0.5")).toBe("en");
    expect(pickLanguage("  en  ")).toBe("en");
  });

  it("elige el idioma servido con más peso, no el primero de la lista", () => {
    expect(pickLanguage("en;q=0.4,es;q=0.9")).toBe("es");
    expect(pickLanguage("es;q=0.3,en;q=0.8")).toBe("en");
  });

  it("salta los idiomas que no servimos aunque pesen más", () => {
    expect(pickLanguage("fr-FR,fr;q=0.9,en;q=0.8,es;q=0.7")).toBe("en");
  });

  it("a igual peso respeta el orden en el que los puso el navegador", () => {
    expect(pickLanguage("en,es")).toBe("en");
    expect(pickLanguage("es,en")).toBe("es");
    expect(pickLanguage("en;q=0.8,es;q=0.8")).toBe("en");
  });

  it("descarta el idioma que el navegador rechaza con `q=0`", () => {
    expect(pickLanguage("en;q=0")).toBe(DEFAULT_LANGUAGE);
    expect(pickLanguage("es;q=0,en;q=0.5")).toBe("en");
  });

  it("resuelve el comodín con el idioma de recurso", () => {
    expect(pickLanguage("*")).toBe(DEFAULT_LANGUAGE);
    expect(pickLanguage("en;q=0.2,*;q=0.9")).toBe(DEFAULT_LANGUAGE);
  });

  it("descarta las entradas con un peso que no es un peso", () => {
    expect(pickLanguage("en;q=alto")).toBe(DEFAULT_LANGUAGE);
    expect(pickLanguage("en;q=2")).toBe(DEFAULT_LANGUAGE);
    expect(pickLanguage("en;q=-1,es;q=0.1")).toBe("es");
  });

  it("aguanta una cabecera rota sin dejar la página sin idioma", () => {
    expect(pickLanguage(",,;;,")).toBe(DEFAULT_LANGUAGE);
    expect(pickLanguage("=?!")).toBe(DEFAULT_LANGUAGE);
    // Basura por delante, pero la petición legítima sigue ahí.
    expect(pickLanguage(";;;,en;q=0.9")).toBe("en");
  });
});

/**
 * La otra fuente de idioma: la preferencia que dejó el conmutador. A
 * diferencia de la cabecera, aquí no vale caer en el idioma de recurso cuando
 * el valor no sirve —eso taparía la negociación con el navegador—, así que lo
 * que se comprueba es que distinga «no hay nada» de «pidió español».
 */
describe("parseLanguage", () => {
  it("reconoce los idiomas que servimos", () => {
    expect(parseLanguage("es")).toBe("es");
    expect(parseLanguage("en")).toBe("en");
  });

  it("devuelve `null` cuando no hay preferencia guardada", () => {
    expect(parseLanguage(null)).toBeNull();
    expect(parseLanguage(undefined)).toBeNull();
    expect(parseLanguage("")).toBeNull();
  });

  it("devuelve `null` con cualquier otro valor, sin caer en el de recurso", () => {
    // Ni un idioma que no servimos, ni uno nuestro con región o en mayúsculas:
    // esto no es una cabecera que negociar, es un valor que escribimos nosotros.
    for (const value of ["de", "es-ES", "EN", " es", "null", "<script>"]) {
      expect(parseLanguage(value)).toBeNull();
    }
  });
});

describe("rememberLanguage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** Documento de mentira: solo la cookie, que es lo único que se escribe. */
  function withDocument({ protocol = "https:" } = {}) {
    const document = { cookie: "" };
    vi.stubGlobal("document", document);
    vi.stubGlobal("location", { protocol });
    return document;
  }

  /** Los atributos de la cookie, sin el par `nombre=valor` de delante. */
  function attributes(cookie: string) {
    return cookie.split(";").slice(1).map((part) => part.trim());
  }

  /**
   * El nombre y el valor tienen que ser exactamente los que espera el
   * servidor: si se separan, la elección se escribe y no la lee nadie.
   */
  it.each(LANGUAGES)("guarda el idioma elegido (%s) donde lo lee el servidor", (language) => {
    const document = withDocument();
    rememberLanguage(language);

    expect(document.cookie.startsWith(`${LANGUAGE_COOKIE}=${language};`)).toBe(true);
    expect(parseLanguage(document.cookie.split(";")[0].split("=")[1])).toBe(language);
  });

  it("la guarda para todo el sitio y durante un año", () => {
    const document = withDocument();
    rememberLanguage("en");

    expect(attributes(document.cookie)).toContain("Path=/");
    expect(attributes(document.cookie)).toContain(`Max-Age=${60 * 60 * 24 * 365}`);
  });

  /** No se manda a terceros: la preferencia no tiene por qué viajar fuera. */
  it("la limita al propio sitio", () => {
    const document = withDocument();
    rememberLanguage("en");

    expect(attributes(document.cookie)).toContain("SameSite=Lax");
  });

  /**
   * `Secure` en producción, pero no en desarrollo: sobre `http` el navegador
   * descarta la cookie sin decir nada y la preferencia se perdería justo donde
   * se prueba.
   */
  it.each([
    ["https:", true],
    ["http:", false],
  ])("solo la marca `Secure` sobre HTTPS (%s)", (protocol, marked) => {
    const document = withDocument({ protocol });
    rememberLanguage("en");

    expect(attributes(document.cookie).includes("Secure")).toBe(marked);
  });

  /**
   * Donde las cookies están prohibidas —un `iframe` en cajón de arena—,
   * escribirlas lanza. Eso no puede llevarse por delante el clic: el idioma ya
   * ha cambiado en la página y lo único que se pierde es recordarlo, igual que
   * con el tema cuando el almacenamiento está bloqueado.
   */
  it("no revienta si el navegador prohíbe escribir cookies", () => {
    vi.stubGlobal("location", { protocol: "https:" });
    vi.stubGlobal("document", {
      set cookie(_value: string) {
        throw new Error("The operation is insecure.");
      },
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(() => rememberLanguage("en")).not.toThrow();
    expect(warn).toHaveBeenCalled();

    warn.mockRestore();
  });
});

describe("nextLanguage", () => {
  it("pasa por todos los idiomas y vuelve al principio", () => {
    let language: Language = LANGUAGES[0];
    const visited: Language[] = [language];
    for (let step = 1; step < LANGUAGES.length; step++) {
      language = nextLanguage(language);
      visited.push(language);
    }

    expect(new Set(visited)).toEqual(new Set(LANGUAGES));
    expect(nextLanguage(language)).toBe(LANGUAGES[0]);
  });
});
