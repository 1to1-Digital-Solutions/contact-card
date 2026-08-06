"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { ThemeName } from "./brand";
import { applyTheme, DEFAULT_THEME, readTheme, THEME_STORAGE_KEY } from "./theme";

/** Quién quiere enterarse de que el tema ha cambiado. */
const listeners = new Set<() => void>();

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

/**
 * El tema que se está viendo, y cómo cambiarlo.
 *
 * La fuente de verdad es la clase de `<html>`, que deja el script en línea antes del primer
 * pintado. Se lee con `useSyncExternalStore` porque eso es justo lo que es: un dato que vive
 * fuera de React. Leerlo en un efecto y meterlo con `setState` provoca un render en cascada
 * —y el propio ESLint de React lo canta—; además así el servidor renderiza con el tema de
 * partida sin desajustar la hidratación.
 */
export function useTheme(): { theme: ThemeName; toggle: () => void } {
  const theme = useSyncExternalStore(
    subscribe,
    readTheme,
    // En el servidor no hay documento: el HTML se pinta con el tema de partida.
    () => DEFAULT_THEME,
  );

  const toggle = useCallback(() => {
    const next: ThemeName = readTheme() === "dark" ? "light" : "dark";
    applyTheme(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch (error) {
      // El tema cambia igual; lo único que se pierde es recordarlo.
      console.warn("No se ha podido recordar el tema elegido:", error);
    }
    for (const onChange of listeners) onChange();
  }, []);

  return { theme, toggle };
}
