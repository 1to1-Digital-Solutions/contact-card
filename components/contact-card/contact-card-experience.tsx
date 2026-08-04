"use client";

import { useState } from "react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { useWebGLStatus } from "@/lib/use-webgl-status";
import { CardFallback } from "./card-fallback";
import { CardScene } from "./card-scene";
import { ContactPanel } from "./contact-panel";
import { SceneErrorBoundary } from "./scene-error-boundary";

const CONTROL_CLASSES =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 text-sm font-medium text-ink-inverse backdrop-blur transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent";

export function ContactCardExperience() {
  const reducedMotion = useReducedMotion();
  // La escena solo puede montarse en el navegador: dibuja las caras de la
  // tarjeta en un canvas 2D, que no existe durante el render del servidor.
  const status = useWebGLStatus();
  const [flipCount, setFlipCount] = useState(0);
  const [resetCount, setResetCount] = useState(0);
  const [showingBack, setShowingBack] = useState(false);
  const [grabbing, setGrabbing] = useState(false);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[1fr_26rem]">
      <section
        aria-label="Tarjeta de contacto interactiva"
        className={`relative flex min-h-[62svh] flex-col justify-between overflow-hidden lg:min-h-dvh ${
          grabbing ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        <div aria-hidden className="card-halo pointer-events-none absolute inset-0" />

        <div className="absolute inset-0 touch-none">
          {status === "pending" && (
            <p
              role="status"
              className="flex h-full items-center justify-center text-sm text-ink-inverse-muted"
            >
              Cargando la tarjeta…
            </p>
          )}

          {status === "unsupported" && (
            <div className="flex h-full items-center justify-center p-6">
              <CardFallback note="Tu navegador no puede mostrar gráficos 3D, así que esta es la versión plana. Pulsa la tarjeta para darle la vuelta." />
            </div>
          )}

          {status === "ready" && (
            <SceneErrorBoundary
              fallback={
                <div className="flex h-full items-center justify-center p-6">
                  <CardFallback note="No hemos podido cargar la tarjeta en 3D. Aquí tienes la versión plana: pulsa para darle la vuelta." />
                </div>
              }
            >
              <CardScene
                flipCount={flipCount}
                resetCount={resetCount}
                onFaceChange={setShowingBack}
                onGrabChange={setGrabbing}
                reducedMotion={reducedMotion}
              />
            </SceneErrorBoundary>
          )}
        </div>

        {status === "ready" && (
          <div className="relative z-10 mt-auto flex flex-wrap items-center gap-3 p-6">
            <button
              type="button"
              onClick={() => setFlipCount((value) => value + 1)}
              className={CONTROL_CLASSES}
            >
              {showingBack ? "Ver el anverso" : "Ver el reverso"}
            </button>
            <button
              type="button"
              onClick={() => setResetCount((value) => value + 1)}
              className={CONTROL_CLASSES}
            >
              Recolocar
            </button>
            <p className="text-sm text-ink-inverse-muted">
              Arrastra la tarjeta para moverla y el fondo para girarla.
            </p>
            <p role="status" className="sr-only">
              {showingBack
                ? "La tarjeta muestra el reverso."
                : "La tarjeta muestra el anverso."}
            </p>
          </div>
        )}
      </section>

      <aside className="border-t border-white/10 bg-black/20 p-6 sm:p-10 lg:border-l lg:border-t-0">
        <ContactPanel />
      </aside>
    </div>
  );
}
