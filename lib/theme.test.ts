import { describe, expect, it } from "vitest";
import { DEFAULT_THEME, parseTheme, THEME_SCRIPT, THEME_STORAGE_KEY } from "./theme";

describe("elección de tema", () => {
  it("respeta los dos temas que existen", () => {
    expect(parseTheme("light")).toBe("light");
    expect(parseTheme("dark")).toBe("dark");
  });

  it("cae en el tema de partida si no hay nada guardado o está estropeado", () => {
    expect(parseTheme(null)).toBe(DEFAULT_THEME);
    expect(parseTheme(undefined)).toBe(DEFAULT_THEME);
    expect(parseTheme("")).toBe(DEFAULT_THEME);
    expect(parseTheme("sepia")).toBe(DEFAULT_THEME);
  });
});

/** Documento y almacenamiento de mentira: lo justo para correr el script. */
function runThemeScript(stored: string | null | { broken: true }) {
  const classes = new Set<string>([DEFAULT_THEME]);
  const document = {
    documentElement: {
      classList: {
        add: (...names: string[]) => names.forEach((name) => classes.add(name)),
        remove: (...names: string[]) => names.forEach((name) => classes.delete(name)),
      },
    },
  };
  const localStorage = {
    getItem(key: string) {
      if (stored && typeof stored === "object") throw new Error("bloqueado");
      return key === THEME_STORAGE_KEY ? stored : null;
    },
  };

  new Function("document", "localStorage", THEME_SCRIPT)(document, localStorage);
  return classes;
}

/**
 * El script en línea es lo que evita ver la página un instante con el tema
 * que no es, y corre antes que nada: si deja mal la clase de `<html>`, no hay
 * segunda oportunidad.
 */
describe("script que fija el tema antes de pintar", () => {
  it("pone el tema que se recordó", () => {
    expect([...runThemeScript("light")]).toEqual(["light"]);
    expect([...runThemeScript("dark")]).toEqual(["dark"]);
  });

  it("deja el de partida si no hay nada guardado", () => {
    expect([...runThemeScript(null)]).toEqual([DEFAULT_THEME]);
  });

  it("deja el de partida si el almacenamiento está bloqueado", () => {
    expect([...runThemeScript({ broken: true })]).toEqual([DEFAULT_THEME]);
  });

  it("nunca deja los dos temas puestos a la vez", () => {
    for (const stored of ["light", "dark", null] as const) {
      const classes = runThemeScript(stored);
      expect(classes.size).toBe(1);
    }
  });
});
