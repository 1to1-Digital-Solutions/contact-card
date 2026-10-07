"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { ThemeName } from "./brand";
import { applyTheme, DEFAULT_THEME, readTheme, THEME_STORAGE_KEY } from "./theme";

/** Who wants to know that the theme has changed. */
const listeners = new Set<() => void>();

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

/**
 * The theme being viewed, and how to change it.
 *
 * The source of truth is the `<html>` class, which the inline script leaves before first
 * paint. It is read with `useSyncExternalStore` because that is exactly what it is: a value
 * that lives outside React. Reading it in an effect and pushing it in with `setState` causes
 * a cascading render —and React's own ESLint flags it—; besides, this way the server renders
 * with the starting theme without a hydration mismatch.
 */
export function useTheme(): { theme: ThemeName; toggle: () => void } {
  const theme = useSyncExternalStore(
    subscribe,
    readTheme,
    // On the server there is no document: the HTML is painted with the starting theme.
    () => DEFAULT_THEME,
  );

  const toggle = useCallback(() => {
    const next: ThemeName = readTheme() === "dark" ? "light" : "dark";
    applyTheme(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch (error) {
      // The theme changes all the same; the only thing lost is remembering it.
      console.warn("Could not remember the chosen theme:", error);
    }
    for (const onChange of listeners) onChange();
  }, []);

  return { theme, toggle };
}
