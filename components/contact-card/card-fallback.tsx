"use client";

import Image from "next/image";
import { useState } from "react";
import { LOGO } from "@/lib/brand";
import { CONTACT } from "@/lib/contact";

/**
 * Tarjeta plana para cuando no hay WebGL o la escena 3D falla. Conserva lo
 * esencial —el mismo diseño y las dos caras, del color del tema, que se giran
 * con un clic o con el teclado— usando solo CSS. El grano que en 3D da el
 * relieve del material aquí lo pone `.paper-grain`.
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
          className="relative block aspect-[85/55] w-[min(90vw,26rem)] rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-ink"
        >
          <span
            aria-hidden="true"
            className="relative block h-full w-full transition-transform duration-700 [transform-style:preserve-3d] motion-reduce:duration-0"
            style={{ transform: showingBack ? "rotateY(180deg)" : undefined }}
          >
            {/* Las dos caras van del mismo color; el filete del canto les
                devuelve la silueta que en 3D da el grosor del papel. */}
            <span className="paper-grain absolute inset-0 flex flex-col justify-between overflow-hidden rounded-2xl border border-ink/10 border-l-4 border-l-accent bg-card p-6 text-left shadow-2xl [backface-visibility:hidden]">
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

            <span className="paper-grain absolute inset-0 flex flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border border-ink/10 bg-card p-6 shadow-2xl [backface-visibility:hidden] [transform:rotateY(180deg)]">
              {/* El mismo fichero que dibuja el reverso en 3D, aquí sin canvas.
                  El `alt` va vacío porque las dos caras cuelgan de un
                  `aria-hidden` (los datos se leen en el panel), y sin
                  optimizar porque es un SVG: se sirve tal cual. */}
              <Image
                src={LOGO.brand.src}
                alt=""
                width={LOGO.brand.width}
                height={LOGO.brand.height}
                unoptimized
                className="h-auto w-2/5"
              />
              <span className="text-xs text-ink-muted">{CONTACT.website}</span>
            </span>
          </span>
        </button>
      </div>

      <p className="max-w-sm text-center text-sm text-ink-muted">{note}</p>
    </div>
  );
}
