"use client";

import { useState } from "react";
import { CONTACT } from "@/lib/contact";

/**
 * Tarjeta plana para cuando no hay WebGL o la escena 3D falla. Conserva lo
 * esencial —el mismo diseño y las dos caras, que se giran con un clic o
 * con el teclado— usando solo CSS.
 *
 * El contenido visual se oculta a los lectores de pantalla porque los
 * mismos datos ya están, enlazables, en el panel de contacto.
 */
export function CardFallback({ note }: { note: string }) {
  const [showingBack, setShowingBack] = useState(false);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="[perspective:1200px]">
        <button
          type="button"
          onClick={() => setShowingBack((value) => !value)}
          aria-label={
            showingBack
              ? "Ver el anverso de la tarjeta"
              : "Ver el reverso de la tarjeta"
          }
          className="relative block aspect-[85/55] w-[min(90vw,26rem)] rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-ink-inverse"
        >
          <span
            aria-hidden="true"
            className="relative block h-full w-full transition-transform duration-700 [transform-style:preserve-3d] motion-reduce:duration-0"
            style={{ transform: showingBack ? "rotateY(180deg)" : undefined }}
          >
            <span className="absolute inset-0 flex flex-col justify-between rounded-2xl border-l-4 border-accent bg-card-front p-6 text-left shadow-2xl [backface-visibility:hidden]">
              <span>
                <span className="block text-xl font-semibold text-ink sm:text-2xl">
                  {CONTACT.name}
                </span>
                <span className="mt-1 block text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-accent-ink">
                  {CONTACT.company}
                </span>
              </span>
              <span className="flex flex-col gap-1 text-sm text-ink">
                <span>{CONTACT.email}</span>
                <span>{CONTACT.phone}</span>
                <span>{CONTACT.website}</span>
              </span>
            </span>

            {/* El reverso es casi del color del fondo: el filete claro hace
                de canto y le devuelve la silueta que en 3D da el papel. */}
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/15 bg-card-back p-6 shadow-2xl [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <span className="flex size-16 items-center justify-center rounded-xl border-2 border-accent text-2xl font-semibold text-ink-inverse">
                1:1
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-ink-inverse">
                {CONTACT.company}
              </span>
              <span className="text-xs text-ink-inverse-muted">
                {CONTACT.website}
              </span>
            </span>
          </span>
        </button>
      </div>

      <p className="max-w-sm text-center text-sm text-ink-inverse-muted">{note}</p>
    </div>
  );
}
