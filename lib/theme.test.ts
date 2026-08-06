import { describe, expect, it } from "vitest";
import { THEMES } from "./brand";
import {
  CHROME_COLOR,
  DEFAULT_THEME,
  parseTheme,
  THEME_SCRIPT,
  THEME_STORAGE_KEY,
} from "./theme";

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
function runThemeScript(
  stored: string | null | { broken: true },
  { withMeta = true } = {},
) {
  const classes = new Set<string>([DEFAULT_THEME]);
  // Sale con el color del tema de partida, que es lo que emite `app/layout.tsx`.
  const meta = { content: CHROME_COLOR[DEFAULT_THEME] };
  const document = {
    documentElement: {
      classList: {
        add: (...names: string[]) => names.forEach((name) => classes.add(name)),
        remove: (...names: string[]) => names.forEach((name) => classes.delete(name)),
      },
    },
    querySelector: () => (withMeta ? meta : null),
  };
  const localStorage = {
    getItem(key: string) {
      if (stored && typeof stored === "object") throw new Error("bloqueado");
      return key === THEME_STORAGE_KEY ? stored : null;
    },
  };

  new Function("document", "localStorage", THEME_SCRIPT)(document, localStorage);
  return { classes, meta };
}

/** Solo las clases, que es lo que mira la mayoría de las comprobaciones. */
const classesAfter = (stored: string | null | { broken: true }) => [
  ...runThemeScript(stored).classes,
];

/**
 * El script en línea es lo que evita ver la página un instante con el tema
 * que no es, y corre antes que nada: si deja mal la clase de `<html>`, no hay
 * segunda oportunidad.
 */
describe("script que fija el tema antes de pintar", () => {
  it("pone el tema que se recordó", () => {
    expect(classesAfter("light")).toEqual(["light"]);
    expect(classesAfter("dark")).toEqual(["dark"]);
  });

  it("deja el de partida si no hay nada guardado", () => {
    expect(classesAfter(null)).toEqual([DEFAULT_THEME]);
  });

  it("deja el de partida si el almacenamiento está bloqueado", () => {
    expect(classesAfter({ broken: true })).toEqual([DEFAULT_THEME]);
  });

  it("nunca deja los dos temas puestos a la vez", () => {
    for (const stored of ["light", "dark", null] as const) {
      expect(classesAfter(stored)).toHaveLength(1);
    }
  });

  /**
   * El marco del navegador (la barra de direcciones en el móvil) sale con el
   * color del tema de partida porque los metadatos de Next son estáticos: si
   * el script no lo corrigiera, al volver con el tema claro recordado la barra
   * se vería oscura sobre una página clara.
   */
  it("deja el `theme-color` del tema que acaba de poner", () => {
    expect(runThemeScript("light").meta.content).toBe(THEMES.light.backdrop);
    expect(runThemeScript("dark").meta.content).toBe(THEMES.dark.backdrop);
    expect(runThemeScript(null).meta.content).toBe(THEMES[DEFAULT_THEME].backdrop);
  });

  it("no revienta si el `<meta>` todavía no está en el documento", () => {
    expect(() => runThemeScript("light", { withMeta: false })).not.toThrow();
  });
});
