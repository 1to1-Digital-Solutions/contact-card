import { describe, expect, it } from "vitest";
import { PROFILES, TRANSLATED } from "./contact";
import { DICTIONARIES, dictionary } from "./dictionary";
import { DEFAULT_LANGUAGE, LANGUAGES } from "./i18n";

/**
 * El tipo `Dictionary` ya obliga a que los dos idiomas tengan las mismas
 * claves; lo que no puede comprobar el compilador es que estén *traducidas*.
 * Copiar el español al inglés para «rellenar» compila igual de bien, y en
 * pantalla se ve una tarjeta a medias.
 */

/** Cadenas de prueba con las que se resuelven los textos con hueco. */
const ARGS = ["Nombre", "Empresa"];

/** Aplana el diccionario a `clave.anidada` → texto, resolviendo las funciones. */
function flatten(value: unknown, path = ""): Map<string, string> {
  const flat = new Map<string, string>();
  if (typeof value === "string") {
    flat.set(path, value);
  } else if (typeof value === "function") {
    flat.set(path, (value as (...args: string[]) => string)(...ARGS));
  } else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      for (const [k, v] of flatten(child, path ? `${path}.${key}` : key)) {
        flat.set(k, v);
      }
    }
  }
  return flat;
}

/**
 * Lo único que se escribe igual en los dos idiomas. Cualquier otra
 * coincidencia es una traducción que falta.
 */
const SHARED = new Set(["fields.email"]);

const flat = new Map(LANGUAGES.map((language) => [language, flatten(dictionary(language))]));
const spanish = flat.get("es")!;

describe("diccionarios", () => {
  it("cubre los idiomas que se sirven, y solo esos", () => {
    expect(Object.keys(DICTIONARIES).sort()).toEqual([...LANGUAGES].sort());
  });

  it.each(LANGUAGES)("tiene en %s las mismas claves que en español", (language) => {
    expect([...flat.get(language)!.keys()].sort()).toEqual([...spanish.keys()].sort());
  });

  it.each(LANGUAGES)("no deja ningún texto vacío en %s", (language) => {
    for (const [key, text] of flat.get(language)!) {
      expect(text.trim(), `${language}.${key}`).not.toBe("");
    }
  });

  it.each(LANGUAGES.filter((language) => language !== "es"))(
    "traduce al %s todo lo que no se escribe igual",
    (language) => {
      const copied = [...flat.get(language)!]
        .filter(([key, text]) => !SHARED.has(key) && text === spanish.get(key))
        .map(([key]) => key);

      expect(copied).toEqual([]);
    },
  );

  /**
   * La pista corta existe para caber en una línea en un móvil: con `text-sm`
   * (14 px) y los 24 px de margen a cada lado, en una pantalla de 375 px entran
   * unos 46 caracteres. Se deja algo de holgura sobre ese número; si se pasa,
   * vuelve a comerse dos líneas y con ellas el sitio de la tarjeta.
   */
  const SHORT_HINT_LIMIT = 44;

  it.each(LANGUAGES)("dice la pista en corto para el móvil en %s", (language) => {
    const { hint, hintShort } = dictionary(language).scene;
    expect(hintShort.length).toBeLessThanOrEqual(SHORT_HINT_LIMIT);
    expect(hintShort.length).toBeLessThan(hint.length);
  });

  it.each(LANGUAGES)(
    "puede etiquetar el conmutador con su texto visible en %s",
    (language) => {
      // El nombre accesible de un control tiene que contener su texto visible
      // para poder pulsarlo por voz (WCAG 2.5.3): el conmutador enseña «EN» y
      // se anuncia «Switch to English».
      const { code, switchTo } = dictionary(language).language;
      expect(switchTo.toLowerCase()).toContain(code.toLowerCase());
    },
  );

  it.each(LANGUAGES)(
    "nombra el enlace de cada perfil sin perder lo que se ve en %s",
    (language) => {
      // Misma regla que en el conmutador (WCAG 2.5.3): el nombre accesible del
      // enlace tiene que contener el texto visible, que aquí es la dirección.
      for (const { name, address } of PROFILES) {
        const label = dictionary(language).panel.profile(name, address);
        expect(label).toContain(address);
        expect(label).toContain(name);
      }
    },
  );
});

/**
 * Los textos de la ficha —el cargo, el lema y a qué se dedica— viven en
 * `lib/contact.ts` y no en el diccionario, pero corren el mismo riesgo: que
 * alguno se quede sin traducir o repetido del español. Se recorren todos en vez
 * de nombrarlos uno a uno para que el próximo entre solo.
 */
describe("textos de la ficha", () => {
  const entries = Object.entries(TRANSLATED);

  it("cubre los que hay, que son los que resuelve `contactIn`", () => {
    expect(entries.map(([key]) => key)).toEqual(["jobTitle", "tagline", "services"]);
  });

  it.each(entries)("escribe %s en todos los idiomas y en cada uno el suyo", (key, byLanguage) => {
    expect(Object.keys(byLanguage).sort()).toEqual([...LANGUAGES].sort());
    expect(new Set(Object.values(byLanguage)).size, key).toBe(LANGUAGES.length);
    for (const text of Object.values(byLanguage)) expect(text.trim()).not.toBe("");
  });

  it("sale en español cuando el navegador no pide nada", () => {
    expect(TRANSLATED.jobTitle[DEFAULT_LANGUAGE]).toBe("Desarrollador full-stack");
    expect(TRANSLATED.services[DEFAULT_LANGUAGE]).toBe(
      "Desarrollo de software personalizado",
    );
  });

  /**
   * El lema se imprime en una línea de la tarjeta, y ahí no hay reflujo que
   * valga: si crece, se sale del papel. El tope sale del cuerpo con el que se
   * dibuja (38 px sobre 2048 de ancho, con 150 de margen a cada lado) dejando
   * un tercio de holgura para las fuentes anchas.
   */
  it.each(LANGUAGES)("dice el lema en una línea de tarjeta en %s", (language) => {
    expect(TRANSLATED.tagline[language].length).toBeLessThanOrEqual(70);
  });
});
