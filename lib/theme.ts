// Between `lib/` modules the path is relative, as in the rest of the
// directory; the `@/` alias is reserved for crossing folders.
import { type ThemeName, THEMES } from "./brand";

/** Where the browser remembers the theme the visitor chose. */
export const THEME_STORAGE_KEY = "contact-card-theme";

/**
 * Starting theme. The card is born dark by design decision, not by following
 * the system preference: the interface button is what rules and its choice is
 * remembered.
 */
export const DEFAULT_THEME: ThemeName = "dark";

/** Any value that is not one of the two themes falls back to the starting one. */
export function parseTheme(value: string | null | undefined): ThemeName {
  return value === "light" || value === "dark" ? value : DEFAULT_THEME;
}

/** The browser chrome (address bar) takes the colour of the backdrop. */
export const CHROME_COLOR: Record<ThemeName, string> = {
  light: THEMES.light.backdrop,
  dark: THEMES.dark.backdrop,
};

/** Selector of the `<meta>` that paints that chrome. `app/layout.tsx` emits it. */
const THEME_COLOR_META = 'meta[name="theme-color"]';

/**
 * Script that runs before first paint to leave the theme class on `<html>`.
 * It is inline on purpose: if it waited for hydration, the page would be seen
 * for an instant with the wrong theme. If storage is blocked (private
 * browsing) the starting theme stays, which is the one the server HTML
 * already carries.
 *
 * Along the way it fixes `theme-color`: Next's metadata is static and cannot
 * know which theme was remembered, so it comes out with the starting one.
 */
export const THEME_SCRIPT = [
  "var d=document.documentElement,t,m;",
  `try{t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})}catch(e){}`,
  `t=t==="light"||t==="dark"?t:${JSON.stringify(DEFAULT_THEME)};`,
  'd.classList.remove("light","dark");',
  "d.classList.add(t);",
  `m=document.querySelector(${JSON.stringify(THEME_COLOR_META)});`,
  `if(m)m.content=${JSON.stringify(CHROME_COLOR)}[t];`,
].join("");

/**
 * The theme currently set on the document. If `<html>` came without a class
 * —a script failure— it falls back to the starting one, which is the one the
 * page was painted with: it does not assume which of the two it is.
 */
export function readTheme(): ThemeName {
  const { classList } = document.documentElement;
  if (classList.contains("light")) return "light";
  if (classList.contains("dark")) return "dark";
  return DEFAULT_THEME;
}

/** Leaves the theme on `<html>`: the tokens in `app/globals.css` hang from it. */
export function applyTheme(theme: ThemeName): void {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);

  // The browser chrome follows the change; otherwise the address bar stays
  // the colour of the previous theme until reload.
  const meta = document.querySelector<HTMLMetaElement>(THEME_COLOR_META);
  if (meta) meta.content = CHROME_COLOR[theme];
}
