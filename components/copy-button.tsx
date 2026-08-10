"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { dictionary } from "@/lib/dictionary";
import type { Language } from "@/lib/i18n";

type State = "idle" | "copied" | "failed";

/** Cuánto se queda el aviso antes de volver el botón a su estado normal. */
const FEEDBACK_MS = 2000;

/**
 * Copia un dato al portapapeles. El resultado se ve (el icono cambia) y se
 * oye (el aviso vive en una región `status`), porque un botón que no confirma
 * nada deja a quien lo pulsa sin saber si ha funcionado.
 */
export function CopyButton({
  value,
  label,
  language,
}: {
  value: string;
  label: string;
  language: Language;
}) {
  const t = dictionary(language).copy;
  const [state, setState] = useState<State>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const copy = useCallback(async () => {
    try {
      // No existe en contextos no seguros: ahí `writeText` revienta y se
      // avisa igual, en vez de fingir que se ha copiado.
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch (error) {
      // El registro es para diagnosticar, no para leer: va sin traducir.
      console.warn(`No se ha podido copiar ${label}:`, error);
      setState("failed");
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), FEEDBACK_MS);
  }, [value, label]);

  return (
    <>
      <button
        type="button"
        onClick={copy}
        aria-label={t.action(label)}
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-ink/15 text-ink-muted transition-colors hover:bg-ink/10 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4"
        >
          {state === "copied" && <path d="m5 12.5 4.5 4.5L19 7" />}
          {state === "failed" && <path d="M6 6l12 12M18 6 6 18" />}
          {state === "idle" && (
            <>
              <rect x="9" y="9" width="11" height="11" rx="2.5" />
              <path d="M5 15H4.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5" />
            </>
          )}
        </svg>
      </button>

      <span role="status" className="sr-only">
        {state === "copied" && t.done(label)}
        {state === "failed" && t.failed(label)}
      </span>
    </>
  );
}
