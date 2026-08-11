"use client";

import type { ReactNode } from "react";
import { dictionary } from "@/lib/dictionary";
import type { Language } from "@/lib/i18n";
import { shareCard, shareFeedback, shareTarget } from "@/lib/share";
import { type Feedback, useFeedback } from "@/lib/use-feedback";
import { DoneIcon, FailedIcon, SceneControl, ShareIcon } from "./scene-control";

/** El icono cuenta en qué acabó, igual que en los botones de copiar. */
const ICON: Record<Feedback, ReactNode> = {
  idle: <ShareIcon />,
  done: <DoneIcon />,
  failed: <FailedIcon />,
};

/**
 * Comparte la tarjeta con el diálogo del sistema. Donde no lo hay —el
 * escritorio, casi siempre— copia el enlace y lo confirma igual que los
 * botones de copiar, para que el botón no se quede sin hacer nada. Compartir
 * de verdad no lleva aviso: el propio diálogo ya lo es.
 */
export function ShareControl({ language }: { language: Language }) {
  const t = dictionary(language);
  const [feedback, announce] = useFeedback();

  const share = async () => {
    const outcome = await shareCard(shareTarget(language), {
      // `navigator.share` no existe en todos los navegadores, y el que lo
      // tiene lo quiere invocado sobre él: por eso se envuelve en vez de
      // pasarse suelto.
      share: "share" in navigator ? (target) => navigator.share(target) : undefined,
      copy: (text) => navigator.clipboard.writeText(text),
      // El registro es para diagnosticar, no para leer: va sin traducir.
      warn: (error) => console.warn("No se ha podido compartir la tarjeta:", error),
    });

    const result = shareFeedback(outcome);
    if (result) announce(result);
  };

  return (
    <>
      <SceneControl label={t.controls.share} icon={ICON[feedback]} onClick={share} />

      <span role="status" className="sr-only">
        {feedback === "done" && t.copy.done(t.copy.link)}
        {feedback === "failed" && t.copy.failed(t.copy.link)}
      </span>
    </>
  );
}
