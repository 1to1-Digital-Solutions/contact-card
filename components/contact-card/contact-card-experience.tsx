"use client";

import { useCallback, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { CONTACT } from "@/lib/contact";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { useTheme } from "@/lib/use-theme";
import { useWebGLStatus } from "@/lib/use-webgl-status";
import { CardFallback } from "./card-fallback";
import { CardScene } from "./card-scene";
import { ContactPanel } from "./contact-panel";
import { ContactSheet } from "./contact-sheet";
import { SceneErrorBoundary } from "./scene-error-boundary";

const SHEET_TITLE = "Datos de contacto";

/**
 * Botón sobrio de la escena: se lee sobre cualquiera de los dos temas. El
 * `pointer-events-auto` va en el botón y no en la fila que los agrupa: esa
 * fila ocupa todo el ancho en cuanto los mandos se reparten en dos líneas, y
 * desde ahí se tragaría el gesto en los huecos entre botones.
 */
const CONTROL_CLASSES =
  "pointer-events-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-ink/15 bg-ink/5 px-5 text-sm font-medium text-ink backdrop-blur transition-colors hover:bg-ink/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-ink";

export function ContactCardExperience() {
  const reducedMotion = useReducedMotion();
  const { theme, toggle } = useTheme();
  // La escena solo puede montarse en el navegador: dibuja las caras de la
  // tarjeta en un canvas 2D, que no existe durante el render del servidor.
  const status = useWebGLStatus();
  const [flipCount, setFlipCount] = useState(0);
  const [resetCount, setResetCount] = useState(0);
  const [showingBack, setShowingBack] = useState(false);
  const [grabbing, setGrabbing] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const flip = () => setFlipCount((value) => value + 1);
  const reset = () => setResetCount((value) => value + 1);
  const openSheet = () => setSheetOpen(true);
  // Estable: de él cuelga la suscripción al ancho de pantalla de la hoja.
  const closeSheet = useCallback(() => setSheetOpen(false), []);

  return (
    // La pantalla completa y sin scroll: la tarjeta es el contenido, no un
    // adorno al principio de una página por la que haya que bajar.
    <div className="flex h-dvh flex-col overflow-hidden lg:grid lg:grid-cols-[1fr_26rem]">
      <section
        aria-label="Tarjeta de contacto interactiva"
        className={`relative flex min-h-0 flex-1 flex-col justify-between overflow-hidden ${
          grabbing ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        <div aria-hidden className="card-halo pointer-events-none absolute inset-0" />

        <div className="absolute inset-0 touch-none">
          {status === "pending" && (
            <p
              role="status"
              className="flex h-full items-center justify-center text-sm text-ink-muted"
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
                theme={theme}
              />
            </SceneErrorBoundary>
          )}
        </div>

        <header className="pointer-events-none relative z-10 flex items-start justify-between gap-4 p-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {CONTACT.name}
            </h1>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent-ink sm:text-sm">
              {CONTACT.company}
            </p>
          </div>
          <ThemeToggle theme={theme} onToggle={toggle} className="pointer-events-auto" />
        </header>

        {/* Como la cabecera: la banda deja pasar el gesto al lienzo y solo los
            mandos lo recogen. Ahora que la tarjeta ocupa la pantalla entera,
            esta franja cae encima de la escena —sobre la propia tarjeta en un
            móvil apaisado—, y sin esto sería una zona muerta de lado a lado. */}
        <div className="pointer-events-none relative z-10 flex flex-col items-center gap-3 p-6 lg:items-start">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {/* Voltear y recolocar solo existen con la escena: la tarjeta
                plana se gira pulsándola. Van aquí en todos los tamaños y no
                dentro de la hoja de datos: desde la hoja, el giro que
                disparan queda tapado justo mientras ocurre. */}
            {status === "ready" && (
              <>
                <button type="button" onClick={flip} className={CONTROL_CLASSES}>
                  {showingBack ? "Ver el anverso" : "Ver el reverso"}
                </button>
                <button type="button" onClick={reset} className={CONTROL_CLASSES}>
                  Recolocar
                </button>
              </>
            )}

            {/* La puerta a los datos no depende de la escena: en pantalla
                estrecha el panel lateral está oculto, así que este botón es
                la única forma de llegar a ellos, también sin WebGL. */}
            <button
              type="button"
              onClick={openSheet}
              className={`${CONTROL_CLASSES} lg:hidden`}
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
                <circle cx="12" cy="12" r="9" />
                <path d="M12 11v5M12 7.6v.4" />
              </svg>
              Ver los datos
            </button>
          </div>

          {status === "ready" && (
            <>
              <p className="text-center text-sm text-ink-muted lg:text-left">
                Arrastra la tarjeta para moverla y el fondo para girarla.
              </p>

              <p role="status" className="sr-only">
                {showingBack
                  ? "La tarjeta muestra el reverso."
                  : "La tarjeta muestra el anverso."}
              </p>
            </>
          )}
        </div>
      </section>

      <aside
        aria-label={SHEET_TITLE}
        className="hidden overflow-y-auto border-ink/10 bg-ink/5 p-6 sm:p-10 lg:block lg:border-l"
      >
        <ContactPanel />
      </aside>

      <ContactSheet open={sheetOpen} onClose={closeSheet} title={SHEET_TITLE}>
        <ContactPanel />
      </ContactSheet>
    </div>
  );
}
