"use client";

import { useCallback, useEffect, useState } from "react";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { CONTACT } from "@/lib/contact";
import { dictionary } from "@/lib/dictionary";
import { applyLanguage, type Language, nextLanguage, rememberLanguage } from "@/lib/i18n";
import { FINE_POINTER, useMediaQuery } from "@/lib/use-media-query";
import { useMotionAccess } from "@/lib/use-motion-access";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { useTheme } from "@/lib/use-theme";
import { useWebGLStatus } from "@/lib/use-webgl-status";
import { CardFallback } from "./card-fallback";
import { CardScene } from "./card-scene";
import { ContactPanel } from "./contact-panel";
import { ContactSheet } from "./contact-sheet";
import {
  DetailsIcon,
  FlipIcon,
  MotionIcon,
  RecenterIcon,
  SceneControl,
} from "./scene-control";
import { SceneErrorBoundary } from "./scene-error-boundary";
import { ShareControl } from "./share-control";

/**
 * @param served Idioma con el que el servidor pintó el HTML: el que se eligió
 *   en una visita anterior o, si no hay elección guardada, el que negoció el
 *   navegador. El conmutador lo cambia aquí y lo deja recordado para la
 *   próxima visita.
 */
export function ContactCardExperience({ language: served }: { language: Language }) {
  const [language, setLanguage] = useState(served);
  const t = dictionary(language);

  const reducedMotion = useReducedMotion();
  const { theme, toggle } = useTheme();
  /**
   * Los sensores del aparato, que en un móvil hacen lo que en un escritorio
   * hace el ratón. Se piden solo donde hay una pantalla táctil: en un
   * escritorio los eventos existen pero no los provoca nadie, y la pista
   * hablaría de agitar un móvil que no está.
   */
  const { access: motionAccess, request: requestMotion } = useMotionAccess();
  const finePointer = useMediaQuery(FINE_POINTER);
  const motionEnabled = motionAccess === "granted" && !finePointer;
  // La escena solo puede montarse en el navegador: dibuja las caras de la
  // tarjeta en un canvas 2D, que no existe durante el render del servidor.
  const status = useWebGLStatus();
  const [flipCount, setFlipCount] = useState(0);
  const [resetCount, setResetCount] = useState(0);
  const [showingBack, setShowingBack] = useState(false);
  const [grabbing, setGrabbing] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // El `lang` de `<html>` y el título de la pestaña los pintó el servidor:
  // viven fuera de este árbol y hay que moverlos a mano, como el tema.
  useEffect(() => {
    applyLanguage(language, dictionary(language).meta.title(CONTACT.name));
  }, [language]);

  const flip = () => setFlipCount((value) => value + 1);
  const reset = () => setResetCount((value) => value + 1);
  const openSheet = () => setSheetOpen(true);
  const switchLanguage = () => {
    const chosen = nextLanguage(language);
    setLanguage(chosen);
    // Fuera del actualizador de estado: React puede llamarlo dos veces, y
    // esto sale del componente (escribe una cookie).
    rememberLanguage(chosen);
  };
  // Estable: de él cuelga la suscripción al ancho de pantalla de la hoja.
  const closeSheet = useCallback(() => setSheetOpen(false), []);

  return (
    // La pantalla completa y sin scroll: la tarjeta es el contenido, no un
    // adorno al principio de una página por la que haya que bajar.
    <div className="flex h-dvh flex-col overflow-hidden lg:grid lg:grid-cols-[1fr_26rem]">
      <section
        aria-label={t.scene.label}
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
              {t.scene.loading}
            </p>
          )}

          {status === "unsupported" && (
            <div className="flex h-full items-center justify-center p-6">
              <CardFallback note={t.scene.noWebgl} language={language} />
            </div>
          )}

          {status === "ready" && (
            <SceneErrorBoundary
              fallback={
                <div className="flex h-full items-center justify-center p-6">
                  <CardFallback note={t.scene.failed} language={language} />
                </div>
              }
            >
              <CardScene
                flipCount={flipCount}
                resetCount={resetCount}
                onFaceChange={setShowingBack}
                onGrabChange={setGrabbing}
                reducedMotion={reducedMotion}
                motionEnabled={motionEnabled}
                theme={theme}
                language={language}
              />
            </SceneErrorBoundary>
          )}
        </div>

        <header className="pointer-events-none relative z-10 flex items-start justify-between gap-4 p-6 phone-landscape:justify-end phone-landscape:p-3">
          {/* En un móvil apaisado el título se oye pero no se ve: la tarjeta
              ocupa la pantalla y ya lleva impresos el nombre y la empresa, así
              que repetirlos aquí encima solo le quitaría sitio. */}
          <div className="phone-landscape:sr-only">
            <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {CONTACT.name}
            </h1>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent-ink sm:text-sm">
              {CONTACT.company}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <LanguageToggle
              language={language}
              onToggle={switchLanguage}
              className="pointer-events-auto"
            />
            <ThemeToggle
              theme={theme}
              language={language}
              onToggle={toggle}
              className="pointer-events-auto"
            />
          </div>
        </header>

        {/* Como la cabecera: la banda deja pasar el gesto al lienzo y solo los
            mandos lo recogen. Ahora que la tarjeta ocupa la pantalla entera,
            esta franja cae encima de la escena —sobre la propia tarjeta en un
            móvil apaisado—, y sin esto sería una zona muerta de lado a lado. */}
        <div className="pointer-events-none relative z-10 flex flex-col items-center gap-3 p-6 phone-landscape:absolute phone-landscape:inset-0 phone-landscape:justify-end phone-landscape:p-3 lg:items-start">
          {/* En un móvil los mandos son solo el icono y caben de sobra en una
              línea; el `flex-wrap` es para el rótulo que aparece con pantalla
              de sobra, que crece con el idioma: sin él, un texto más largo que
              el de hoy se saldría de la pantalla en vez de bajar de línea.
              Apaisado no hay alto que gastar en una banda: los mandos se van
              en columna al borde derecho, flotando sobre la tarjeta. */}
          <div className="flex flex-wrap items-center justify-center gap-3 phone-landscape:absolute phone-landscape:right-3 phone-landscape:top-1/2 phone-landscape:-translate-y-1/2 phone-landscape:flex-col phone-landscape:flex-nowrap phone-landscape:gap-2">
            {/* Voltear y recolocar solo existen con la escena: la tarjeta
                plana se gira pulsándola. Van aquí en todos los tamaños y no
                dentro de la hoja de datos: desde la hoja, el giro que
                disparan queda tapado justo mientras ocurre. */}
            {status === "ready" && (
              <>
                <SceneControl
                  label={showingBack ? t.controls.showFront : t.controls.showBack}
                  icon={<FlipIcon />}
                  onClick={flip}
                />
                <SceneControl
                  label={t.controls.reset}
                  icon={<RecenterIcon />}
                  onClick={reset}
                />

                {/* Solo donde el navegador exige permiso para leer los
                    sensores (iOS), y solo hasta que se conceda: donde no hace
                    falta pedirlo, la tarjeta ya responde al móvil sin que
                    nadie pulse nada. */}
                {motionAccess === "prompt" && (
                  <SceneControl
                    label={t.controls.useMotion}
                    icon={<MotionIcon />}
                    onClick={requestMotion}
                  />
                )}
              </>
            )}

            {/* La puerta a los datos no depende de la escena: en pantalla
                estrecha el panel lateral está oculto, así que este botón es
                la única forma de llegar a ellos, también sin WebGL. */}
            <SceneControl
              label={t.controls.showData}
              icon={<DetailsIcon />}
              onClick={openSheet}
              className="lg:hidden"
            />

            {/* Compartir va el último y con el mismo aspecto sobrio que sus
                vecinos: la acción principal sigue siendo «Guardar contacto»,
                que es el único botón con el color de marca. */}
            <ShareControl language={language} />
          </div>

          {status === "ready" && (
            <>
              {/* La misma pista, dicha en corto donde no cabe entera: en un
                  móvil, cada línea de texto aquí abajo se la quita a la
                  tarjeta. Con los sensores en marcha cuenta lo de agitar, que
                  es lo más rápido y lo único que no se descubre solo. */}
              <p className="text-center text-sm text-ink-muted roomy:hidden">
                {motionEnabled ? t.scene.hintMotion : t.scene.hintShort}
              </p>
              <p className="hidden text-center text-sm text-ink-muted roomy:block lg:text-left">
                {t.scene.hint}
              </p>

              <p role="status" className="sr-only">
                {showingBack ? t.scene.showingBack : t.scene.showingFront}
              </p>
            </>
          )}
        </div>
      </section>

      <aside
        aria-label={t.panel.title}
        className="hidden overflow-y-auto border-ink/10 bg-ink/5 p-6 sm:p-10 lg:block lg:border-l"
      >
        <ContactPanel language={language} />
      </aside>

      <ContactSheet
        open={sheetOpen}
        onClose={closeSheet}
        title={t.panel.title}
        closeLabel={t.panel.close}
      >
        <ContactPanel language={language} />
      </ContactSheet>
    </div>
  );
}
