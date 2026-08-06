"use client";

import { useCallback, useEffect, useState } from "react";
import type { ThemeName } from "@/lib/brand";
import {
  applyTheme,
  DEFAULT_THEME,
  readTheme,
  THEME_STORAGE_KEY,
} from "@/lib/theme";

/**
 * El tema que se está viendo, y cómo cambiarlo. La fuente de verdad es la
 * clase de `<html>` —la deja el script en línea antes de pintar—: aquí se
 * lee tras montar, porque durante el render del servidor no hay documento.
 */
export function useTheme(): { theme: ThemeName; toggle: () => void } {
  const [theme, setTheme] = useState<ThemeName>(DEFAULT_THEME);

  useEffect(() => {
    setTheme(readTheme());
  }, []);

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      applyTheme(next);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch (error) {
        // El tema cambia igual; lo único que se pierde es recordarlo.
        console.warn("No se ha podido recordar el tema elegido:", error);
      }
      return next;
    });
  }, []);

  return { theme, toggle };
}
