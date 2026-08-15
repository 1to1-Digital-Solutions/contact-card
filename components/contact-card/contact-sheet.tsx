"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";

/** El ancho a partir del cual manda el panel fijo: el `lg:` de las clases. */
const WIDE = "(min-width: 64rem)";

/**
 * Hoja de datos para pantallas estrechas, donde la tarjeta se queda con toda
 * la pantalla. Es un `<dialog>` de verdad y no un panel a mano: de él salen
 * gratis el cierre con Escape, el foco atrapado mientras está abierta y la
 * vuelta del foco al botón que la abrió.
 */
export function ContactSheet({
  open,
  onClose,
  title,
  closeLabel,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel: string;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  /**
   * Al ensanchar la pantalla —girar una tableta, redimensionar la ventana— la
   * hoja desaparece por CSS (`lg:hidden`), pero seguiría abierta y modal: el
   * resto de la página quedaría inerte sin nada visible que cerrar. Se cierra
   * sola en cuanto manda el panel fijo, que ya enseña los mismos datos.
   */
  useEffect(() => {
    if (!open) return;
    const wide = window.matchMedia(WIDE);
    if (wide.matches) {
      onClose();
      return;
    }
    const onWiden = (event: MediaQueryListEvent) => {
      if (event.matches) onClose();
    };
    wide.addEventListener("change", onWiden);
    return () => wide.removeEventListener("change", onWiden);
  }, [open, onClose]);

  /**
   * El clic sobre el fondo llega al propio `<dialog>`, pero también el que cae
   * en su relleno: sin comprobar dónde ha caído, tocar el borde de la hoja la
   * cerraría (y en una hoja anclada abajo ese borde es justo donde va el dedo).
   */
  const closeIfOutside = useCallback(
    (event: React.MouseEvent<HTMLDialogElement>) => {
      const element = dialog.current;
      if (!element || event.target !== element) return;
      const box = element.getBoundingClientRect();
      const inside =
        event.clientX >= box.left &&
        event.clientX <= box.right &&
        event.clientY >= box.top &&
        event.clientY <= box.bottom;
      if (!inside) onClose();
    },
    [onClose],
  );

  return (
    <dialog
      ref={dialog}
      aria-label={title}
      onClose={onClose}
      onClick={closeIfOutside}
      // `contact-sheet` es la entrada y la salida deslizándose: vive en
      // `app/globals.css` porque necesita `@starting-style`, y allí entra desde
      // abajo o desde la derecha según de qué borde cuelgue la hoja.
      //
      // Apaisado no hay alto que repartir —la hoja de abajo dejaba ver dos
      // datos por pantallazo— y sí ancho de sobra: se va al borde derecho, de
      // arriba abajo, y los datos se reparten en dos columnas (`ContactPanel`).
      className="contact-sheet fixed bottom-0 left-0 right-0 top-auto m-0 max-h-[82dvh] w-full max-w-none overflow-y-auto rounded-t-3xl border-t border-ink/10 bg-backdrop p-6 text-ink shadow-2xl backdrop:bg-black/50 phone-landscape:left-auto phone-landscape:top-0 phone-landscape:h-full phone-landscape:max-h-none phone-landscape:w-[min(40rem,76vw)] phone-landscape:rounded-l-3xl phone-landscape:rounded-tr-none phone-landscape:border-l phone-landscape:border-t-0 phone-landscape:p-4 lg:hidden"
    >
      <div className="mx-auto flex max-w-md flex-col gap-6 phone-landscape:max-w-none phone-landscape:gap-3">
        {/* Con la hoja de arriba abajo, el título y la salida se quedan a la
            vista aunque haya que bajar por los datos. El desplazamiento
            negativo y el relleno propio son para tapar el borde de la hoja:
            ahí es donde los datos asomarían al pasar por detrás. */}
        <div className="flex items-start justify-between gap-4 phone-landscape:sticky phone-landscape:-top-4 phone-landscape:z-10 phone-landscape:-mt-4 phone-landscape:bg-backdrop phone-landscape:pt-4">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:bg-ink/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              className="size-5"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
