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
          // El `45dvh` es lo que la ata al alto y no solo al ancho: la página
          // ya no tiene scroll, así que en un hueco bajo —un móvil apaisado—
          // la tarjeta plana crecía hasta meterse debajo de la cabecera y de
          // la banda de mandos, y el texto salía encabalgado. En pantallas
          // altas nunca manda: ahí sigue decidiendo el ancho.
          //
          // `@container` es lo que deja que lo de dentro se mida en `cqw`
          // —centésimas del ancho de la propia tarjeta— en vez de en píxeles:
          // así el papel impreso se encoge entero, con sus proporciones, en
          // lugar de recortar el texto cuando la tarjeta baja de tamaño.
          className="@container relative block aspect-[85/55] w-[min(90vw,26rem,45dvh)] rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-ink"
        >
          <span
            aria-hidden="true"
            className="relative block h-full w-full transition-transform duration-700 [transform-style:preserve-3d] motion-reduce:duration-0"
            style={{ transform: showingBack ? "rotateY(180deg)" : undefined }}
          >
            {/* Las dos caras van del mismo color; el filete del canto les
                devuelve la silueta que en 3D da el grosor del papel. Las
                medidas van en `cqw` para que la cara entera se escale con la
                tarjeta: los valores son los mismos de antes (24 px de margen,
                24 px de nombre…) traducidos sobre su ancho máximo, 26rem. */}
            <span className="paper-grain absolute inset-0 flex flex-col justify-between overflow-hidden rounded-2xl border border-ink/10 border-l-[1cqw] border-l-accent bg-card p-[5.8cqw] text-left shadow-2xl [backface-visibility:hidden]">
              <span>
                <span className="block text-[5.8cqw] font-semibold text-ink">
                  {CONTACT.name}
                </span>
                <span className="mt-[1cqw] block text-[2.5cqw] font-semibold uppercase tracking-[0.2em] text-accent-ink">
                  {CONTACT.company}
                </span>
              </span>
              <span className="flex flex-col gap-[1cqw] text-[3.4cqw] text-ink">
                <span>{CONTACT.email}</span>
                <span>{CONTACT.phone}</span>
                <span>{CONTACT.website}</span>
              </span>
            </span>

            <span className="paper-grain absolute inset-0 flex flex-col items-center justify-center gap-[3.8cqw] overflow-hidden rounded-2xl border border-ink/10 bg-card p-[5.8cqw] shadow-2xl [backface-visibility:hidden] [transform:rotateY(180deg)]">
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
              <span className="text-[2.9cqw] text-ink-muted">{CONTACT.website}</span>
            </span>
          </span>
        </button>
      </div>

      <p className="max-w-sm text-center text-sm text-ink-muted">{note}</p>
    </div>
  );
}
