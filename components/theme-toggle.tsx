"use client";

import type { ThemeName } from "@/lib/brand";
import { dictionary } from "@/lib/dictionary";
import type { Language } from "@/lib/i18n";

/**
 * Cambia el tema de la página y, con él, el color de las dos caras de la
 * tarjeta. El icono muestra a dónde lleva el botón, no dónde se está: es lo
 * que se espera de un interruptor con etiqueta de acción.
 */
export function ThemeToggle({
  theme,
  language,
  onToggle,
  className = "",
}: {
  theme: ThemeName;
  language: Language;
  onToggle: () => void;
  className?: string;
}) {
  const t = dictionary(language).theme;
  const goingLight = theme === "dark";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={goingLight ? t.toLight : t.toDark}
      className={`inline-flex size-11 items-center justify-center rounded-full border border-ink/15 bg-ink/5 text-ink backdrop-blur transition-colors hover:bg-ink/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-ink ${className}`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5"
      >
        {goingLight ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        ) : (
          <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5Z" />
        )}
      </svg>
    </button>
  );
}
