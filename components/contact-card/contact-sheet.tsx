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
      className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-[82dvh] w-full max-w-none overflow-y-auto rounded-t-3xl border-t border-ink/10 bg-backdrop p-6 text-ink shadow-2xl backdrop:bg-black/50 lg:hidden"
    >
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
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
