import { describe, expect, it } from "vitest";
import {
  DEFAULT_LANGUAGE,
  type Language,
  LANGUAGES,
  nextLanguage,
  pickLanguage,
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
