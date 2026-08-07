import { afterEach, describe, expect, it, vi } from "vitest";
import { THEMES } from "./brand";
import {
  applyTheme,
  CHROME_COLOR,
  DEFAULT_THEME,
  parseTheme,
  readTheme,
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

/**
 * Documento de mentira: lo justo que tocan el script y `applyTheme`. Arranca
 * como el HTML que emite `app/layout.tsx`, con el tema de partida puesto y el
 * `<meta>` de su color.
 */
function fakeDocument({ withMeta = true } = {}) {
  const classes = new Set<string>([DEFAULT_THEME]);
  const meta = { content: CHROME_COLOR[DEFAULT_THEME] };
  const document = {
    documentElement: {
      classList: {
        add: (...names: string[]) => names.forEach((name) => classes.add(name)),
        remove: (...names: string[]) => names.forEach((name) => classes.delete(name)),
        contains: (name: string) => classes.has(name),
      },
    },
    querySelector: () => (withMeta ? meta : null),
  };
  return { classes, meta, document };
}

/** El script en línea, con almacenamiento de mentira: `null` es «no hay nada
 *  guardado» y un objeto, «el almacenamiento está bloqueado». */
function runThemeScript(
  stored: string | null | { broken: true },
  { withMeta = true } = {},
) {
  const { classes, meta, document } = fakeDocument({ withMeta });
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

/**
 * La otra mitad del tema: la que corre al pulsar el botón. `applyTheme` hace
 * sobre el documento lo mismo que el script en línea, pero escrito aparte
 * (uno es una cadena para el HTML y la otra, código del cliente), así que aquí
 * se les pide el mismo resultado para que no se separen.
 */
describe("cambio de tema al pulsar el botón", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** Deja el documento de mentira como el activo y devuelve lo que se le mira. */
  function withDocument({ withMeta = true } = {}) {
    const dom = fakeDocument({ withMeta });
    vi.stubGlobal("document", dom.document);
    return dom;
  }

  it("pone el tema pedido y nunca deja los dos a la vez", () => {
    const dom = withDocument();
    for (const theme of ["light", "dark", "light"] as const) {
      applyTheme(theme);
      expect([...dom.classes]).toEqual([theme]);
    }
  });

  it("mueve el `theme-color` con el tema, no solo la clase", () => {
    const dom = withDocument();
    applyTheme("light");
    expect(dom.meta.content).toBe(THEMES.light.backdrop);
    applyTheme("dark");
    expect(dom.meta.content).toBe(THEMES.dark.backdrop);
  });

  it("no revienta si el `<meta>` no está en el documento", () => {
    withDocument({ withMeta: false });
    expect(() => applyTheme("light")).not.toThrow();
  });

  it("lee de `<html>` el tema que acaba de dejar puesto", () => {
    withDocument();
    applyTheme("light");
    expect(readTheme()).toBe("light");
    applyTheme("dark");
    expect(readTheme()).toBe("dark");
  });

  /**
   * Si en `<html>` no hay ninguna de las dos clases del tema —el script falló,
   * o lo que hay es una clase de otra cosa—, la interfaz debe seguir enseñando
   * el tema con el que se pintó la página. Ninguno de los dos temas puede ser
   * el que se dé por supuesto al no encontrar el otro.
   */
  it.each([[], ["antialiased"]])(
    "cae en el tema de partida si `<html>` no trae ninguna de las dos clases (%s)",
    (...classes) => {
      const dom = withDocument();
      dom.classes.clear();
      for (const name of classes) dom.classes.add(name);
      expect(readTheme()).toBe(DEFAULT_THEME);
    },
  );

  it.each(["light", "dark"] as const)(
    "lee la clase `%s` puesta a mano, sin pasar por `applyTheme`",
    (theme) => {
      const dom = withDocument();
      dom.classes.clear();
      dom.classes.add(theme);
      expect(readTheme()).toBe(theme);
    },
  );

  it("deja el documento igual que el script en línea", () => {
    for (const theme of ["light", "dark"] as const) {
      const script = runThemeScript(theme);
      const dom = withDocument();
      applyTheme(theme);

      expect([...dom.classes]).toEqual([...script.classes]);
      expect(dom.meta.content).toBe(script.meta.content);
      vi.unstubAllGlobals();
    }
  });
});
