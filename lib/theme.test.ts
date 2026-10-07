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

describe("theme choice", () => {
  it("respects the two themes that exist", () => {
    expect(parseTheme("light")).toBe("light");
    expect(parseTheme("dark")).toBe("dark");
  });

  it("falls back to the starting theme if nothing is stored or it is corrupt", () => {
    expect(parseTheme(null)).toBe(DEFAULT_THEME);
    expect(parseTheme(undefined)).toBe(DEFAULT_THEME);
    expect(parseTheme("")).toBe(DEFAULT_THEME);
    expect(parseTheme("sepia")).toBe(DEFAULT_THEME);
  });
});

/**
 * Fake document: just what the script and `applyTheme` touch. It starts out
 * like the HTML `app/layout.tsx` emits, with the starting theme set and the
 * `<meta>` of its colour.
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

/** The inline script, with fake storage: `null` is "nothing stored" and an
 *  object, "storage is blocked". */
function runThemeScript(
  stored: string | null | { broken: true },
  { withMeta = true } = {},
) {
  const { classes, meta, document } = fakeDocument({ withMeta });
  const localStorage = {
    getItem(key: string) {
      if (stored && typeof stored === "object") throw new Error("blocked");
      return key === THEME_STORAGE_KEY ? stored : null;
    },
  };

  new Function("document", "localStorage", THEME_SCRIPT)(document, localStorage);
  return { classes, meta };
}

/** Just the classes, which is what most of the checks look at. */
const classesAfter = (stored: string | null | { broken: true }) => [
  ...runThemeScript(stored).classes,
];

/**
 * The inline script is what prevents seeing the page for an instant with the
 * wrong theme, and it runs before anything else: if it leaves the `<html>`
 * class wrong, there is no second chance.
 */
describe("script that sets the theme before paint", () => {
  it("sets the theme that was remembered", () => {
    expect(classesAfter("light")).toEqual(["light"]);
    expect(classesAfter("dark")).toEqual(["dark"]);
  });

  it("leaves the starting one if nothing is stored", () => {
    expect(classesAfter(null)).toEqual([DEFAULT_THEME]);
  });

  it("leaves the starting one if storage is blocked", () => {
    expect(classesAfter({ broken: true })).toEqual([DEFAULT_THEME]);
  });

  it("never leaves both themes set at once", () => {
    for (const stored of ["light", "dark", null] as const) {
      expect(classesAfter(stored)).toHaveLength(1);
    }
  });

  /**
   * The browser chrome (the address bar on a phone) comes out with the colour
   * of the starting theme because Next's metadata is static: if the script
   * did not fix it, coming back with the light theme remembered would show a
   * dark bar over a light page.
   */
  it("leaves the `theme-color` of the theme it has just set", () => {
    expect(runThemeScript("light").meta.content).toBe(THEMES.light.backdrop);
    expect(runThemeScript("dark").meta.content).toBe(THEMES.dark.backdrop);
    expect(runThemeScript(null).meta.content).toBe(THEMES[DEFAULT_THEME].backdrop);
  });

  it("does not blow up if the `<meta>` is not in the document yet", () => {
    expect(() => runThemeScript("light", { withMeta: false })).not.toThrow();
  });
});

/**
 * The other half of the theme: the one that runs when the button is pressed.
 * `applyTheme` does to the document the same as the inline script, but
 * written separately (one is a string for the HTML and the other, client
 * code), so here they are asked for the same result so they do not drift
 * apart.
 */
describe("theme change on button press", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** Makes the fake document the active one and returns what gets inspected. */
  function withDocument({ withMeta = true } = {}) {
    const dom = fakeDocument({ withMeta });
    vi.stubGlobal("document", dom.document);
    return dom;
  }

  it("sets the requested theme and never leaves both at once", () => {
    const dom = withDocument();
    for (const theme of ["light", "dark", "light"] as const) {
      applyTheme(theme);
      expect([...dom.classes]).toEqual([theme]);
    }
  });

  it("moves the `theme-color` along with the theme, not just the class", () => {
    const dom = withDocument();
    applyTheme("light");
    expect(dom.meta.content).toBe(THEMES.light.backdrop);
    applyTheme("dark");
    expect(dom.meta.content).toBe(THEMES.dark.backdrop);
  });

  it("does not blow up if the `<meta>` is not in the document", () => {
    withDocument({ withMeta: false });
    expect(() => applyTheme("light")).not.toThrow();
  });

  it("reads from `<html>` the theme it has just set", () => {
    withDocument();
    applyTheme("light");
    expect(readTheme()).toBe("light");
    applyTheme("dark");
    expect(readTheme()).toBe("dark");
  });

  /**
   * If `<html>` has neither of the two theme classes —the script failed, or
   * what is there is a class for something else—, the interface must keep
   * showing the theme the page was painted with. Neither theme can be the one
   * assumed when the other is not found.
   */
  it.each([[], ["antialiased"]])(
    "falls back to the starting theme if `<html>` has neither of the two classes (%s)",
    (...classes) => {
      const dom = withDocument();
      dom.classes.clear();
      for (const name of classes) dom.classes.add(name);
      expect(readTheme()).toBe(DEFAULT_THEME);
    },
  );

  it.each(["light", "dark"] as const)(
    "reads the `%s` class set by hand, without going through `applyTheme`",
    (theme) => {
      const dom = withDocument();
      dom.classes.clear();
      dom.classes.add(theme);
      expect(readTheme()).toBe(theme);
    },
  );

  it("leaves the document the same as the inline script", () => {
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
