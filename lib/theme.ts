// Entre módulos de `lib/` la ruta va relativa, como en el resto: el alias
// `@/` lo resuelve Next, pero no Vitest, y esto lo cargan sus tests.
import { type ThemeName, THEMES } from "./brand";

/** Dónde recuerda el navegador el tema que eligió quien visita la página. */
export const THEME_STORAGE_KEY = "contact-card-theme";

/**
 * Tema de partida. La tarjeta nace oscura por decisión de diseño, no por
 * seguir la preferencia del sistema: el botón de la interfaz es el que manda
 * y su elección se recuerda.
 */
export const DEFAULT_THEME: ThemeName = "dark";

/** Cualquier valor que no sea uno de los dos temas cae en el de partida. */
export function parseTheme(value: string | null | undefined): ThemeName {
  return value === "light" || value === "dark" ? value : DEFAULT_THEME;
}

/** El marco del navegador (barra de direcciones) va del color del fondo. */
export const CHROME_COLOR: Record<ThemeName, string> = {
  light: THEMES.light.backdrop,
  dark: THEMES.dark.backdrop,
};

/** Selector del `<meta>` que pinta ese marco. Lo emite `app/layout.tsx`. */
const THEME_COLOR_META = 'meta[name="theme-color"]';

/**
 * Script que corre antes del primer pintado para dejar la clase del tema en
 * `<html>`. Va en línea a propósito: si esperase a la hidratación, la página
 * se vería un instante con el tema que no es. Si el almacenamiento está
 * bloqueado (navegación privada) se queda el tema de partida, que es el que
 * ya trae el HTML del servidor.
 *
 * De paso corrige el `theme-color`: los metadatos de Next son estáticos y no
 * pueden saber qué tema se recordó, así que salen con el de partida.
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
 * El tema que hay puesto ahora mismo en el documento. Si `<html>` viniera sin
 * clase —un fallo del script— cae en el de partida, que es con el que se
 * pintó la página: no se da por hecho cuál de los dos es.
 */
export function readTheme(): ThemeName {
  const { classList } = document.documentElement;
  if (classList.contains("light")) return "light";
  if (classList.contains("dark")) return "dark";
  return DEFAULT_THEME;
}

/** Deja el tema en `<html>`: de ahí cuelgan los tokens de `app/globals.css`. */
export function applyTheme(theme: ThemeName): void {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);

  // El marco del navegador acompaña al cambio; si no, la barra de direcciones
  // se queda del color del tema anterior hasta recargar.
  const meta = document.querySelector<HTMLMetaElement>(THEME_COLOR_META);
  if (meta) meta.content = CHROME_COLOR[theme];
}
