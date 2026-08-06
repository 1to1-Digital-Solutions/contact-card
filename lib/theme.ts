import type { ThemeName } from "@/lib/brand";

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

/**
 * Script que corre antes del primer pintado para dejar la clase del tema en
 * `<html>`. Va en línea a propósito: si esperase a la hidratación, la página
 * se vería un instante con el tema que no es. Si el almacenamiento está
 * bloqueado (navegación privada) se queda el tema de partida, que es el que
 * ya trae el HTML del servidor.
 */
export const THEME_SCRIPT = [
  "var d=document.documentElement,t;",
  `try{t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})}catch(e){}`,
  'd.classList.remove("light","dark");',
  `d.classList.add(t==="light"||t==="dark"?t:${JSON.stringify(DEFAULT_THEME)});`,
].join("");

/** El tema que hay puesto ahora mismo en el documento. */
export function readTheme(): ThemeName {
  return document.documentElement.classList.contains("light") ? "light" : "dark";
}

/** Deja el tema en `<html>`: de ahí cuelgan los tokens de `app/globals.css`. */
export function applyTheme(theme: ThemeName): void {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
}
