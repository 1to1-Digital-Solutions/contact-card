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
 * @param served Language the server rendered the HTML with: the one chosen
 *   on a previous visit or, if there is no saved choice, the one the browser
 *   negotiated. The toggle changes it here and leaves it remembered for the
 *   next visit.
 */
export function ContactCardExperience({ language: served }: { language: Language }) {
  const [language, setLanguage] = useState(served);
  const t = dictionary(language);

  const reducedMotion = useReducedMotion();
  const { theme, toggle } = useTheme();
  /**
   * The device sensors, which on a phone do what the mouse does on a desktop.
   * They are requested only where there is a touch screen: on a desktop the
   * events exist but nobody triggers them, and the hint would talk about
   * shaking a phone that is not there.
   */
  const { access: motionAccess, request: requestMotion } = useMotionAccess();
  const finePointer = useMediaQuery(FINE_POINTER);
  const motionEnabled = motionAccess === "granted" && !finePointer;
  // The scene can only mount in the browser: it draws the card faces on a 2D
  // canvas, which does not exist during server rendering.
  const status = useWebGLStatus();
  const [flipCount, setFlipCount] = useState(0);
  const [resetCount, setResetCount] = useState(0);
  const [showingBack, setShowingBack] = useState(false);
  const [grabbing, setGrabbing] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // The `lang` of `<html>` and the tab title were rendered by the server:
  // they live outside this tree and have to be moved by hand, like the theme.
  useEffect(() => {
    applyLanguage(language, dictionary(language).meta.title(CONTACT.name));
  }, [language]);

  const flip = () => setFlipCount((value) => value + 1);
  const reset = () => setResetCount((value) => value + 1);
  const openSheet = () => setSheetOpen(true);
  const switchLanguage = () => {
    const chosen = nextLanguage(language);
    setLanguage(chosen);
    // Outside the state updater: React may call it twice, and this leaves the
    // component (it writes a cookie).
    rememberLanguage(chosen);
  };
  // Stable: the sheet's subscription to the screen width hangs from it.
  const closeSheet = useCallback(() => setSheetOpen(false), []);

  return (
    // Full screen and no scrolling: the card is the content, not an ornament
    // at the top of a page one has to scroll down.
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
          {/* On a phone in landscape the title is heard but not seen: the card
              takes up the screen and already has the name and the company
              printed on it, so repeating them up here would only take room
              from it. */}
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

        {/* Like the header: the strip lets the gesture through to the canvas
            and only the controls catch it. Now that the card takes up the
            whole screen, this band lands on top of the scene —over the card
            itself on a phone in landscape—, and without this it would be a
            dead zone from side to side. */}
        <div className="pointer-events-none relative z-10 flex flex-col items-center gap-3 p-6 phone-landscape:absolute phone-landscape:inset-0 phone-landscape:justify-end phone-landscape:p-3 lg:items-start">
          {/* On a phone the controls are icon-only and fit on one line with
              room to spare; the `flex-wrap` is for the label that appears
              with a roomy screen, which grows with the language: without it,
              a text longer than today's would run off the screen instead of
              wrapping. In landscape there is no height to spend on a strip:
              the controls go in a column at the right edge, floating over the
              card. They are centered in what is left below the header
              (`top-14`, which is its padding plus the height of a button) and
              not in the whole screen: with the five controls —the usual four
              plus the iOS permission one— the column is taller than the free
              space on a short phone and would climb over the toggles. */}
          <div className="flex flex-wrap items-center justify-center gap-3 phone-landscape:absolute phone-landscape:top-14 phone-landscape:bottom-0 phone-landscape:right-3 phone-landscape:flex-col phone-landscape:flex-nowrap phone-landscape:gap-2">
            {/* Flip and recenter only exist with the scene: the flat card is
                flipped by pressing it. They go here at every size and not
                inside the data sheet: from the sheet, the turn they trigger
                stays covered right while it happens. */}
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

                {/* Only where the browser demands permission to read the
                    sensors (iOS), and only until it is granted: where asking
                    is not needed, the card already responds to the phone
                    without anyone pressing anything. With a mouse it is not
                    offered either: an iPad with a keyboard reports
                    `pointer: fine` and there the sensors are not listened
                    to, so the button would open the system dialog to ask for
                    a permission that is not going to be used. */}
                {motionAccess === "prompt" && !finePointer && (
                  <SceneControl
                    label={t.controls.useMotion}
                    icon={<MotionIcon />}
                    onClick={requestMotion}
                  />
                )}
              </>
            )}

            {/* The door to the data does not depend on the scene: on a narrow
                screen the side panel is hidden, so this button is the only
                way to reach it, also without WebGL. */}
            <SceneControl
              label={t.controls.showData}
              icon={<DetailsIcon />}
              onClick={openSheet}
              className="lg:hidden"
            />

            {/* Share goes last and with the same sober look as its neighbors:
                the primary action is still "Save contact", which is the only
                button in the brand color. */}
            <ShareControl language={language} />
          </div>

          {status === "ready" && (
            <>
              {/* The same hint, said briefly where it does not fit in full: on
                  a phone, every line of text down here is taken from the
                  card. With the sensors running it mentions shaking, which is
                  the fastest and the only one that is not discovered alone. */}
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
