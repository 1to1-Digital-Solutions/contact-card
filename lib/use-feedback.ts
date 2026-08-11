"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** En qué acabó lo que hizo el botón: es lo que se ve y lo que se anuncia. */
export type Feedback = "idle" | "done" | "failed";

/** Cuánto se queda el aviso antes de que el botón vuelva a su estado normal. */
const FEEDBACK_MS = 2000;

/**
 * Aviso pasajero de un botón que confirma lo que ha hecho, porque un botón que
 * no confirma nada deja a quien lo pulsa sin saber si ha funcionado.
 *
 * El temporizador se cancela al desmontar y también en cada aviso nuevo: si no,
 * el de la pulsación anterior borraría el aviso que acaba de salir.
 */
export function useFeedback(): [Feedback, (result: Exclude<Feedback, "idle">) => void] {
  const [feedback, setFeedback] = useState<Feedback>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const announce = useCallback((result: Exclude<Feedback, "idle">) => {
    setFeedback(result);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setFeedback("idle"), FEEDBACK_MS);
  }, []);

  return [feedback, announce];
}
