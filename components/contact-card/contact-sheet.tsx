"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";

/** The width from which the fixed panel takes over: the `lg:` of the classes. */
const WIDE = "(min-width: 64rem)";

/**
 * Data sheet for narrow screens, where the card keeps the whole screen. It
 * is a real `<dialog>` and not a hand-made panel: from it come for free the
 * close on Escape, the focus trapped while it is open and the return of
 * focus to the button that opened it.
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
   * When the screen widens —rotating a tablet, resizing the window— the sheet
   * disappears via CSS (`lg:hidden`), but it would still be open and modal:
   * the rest of the page would be inert with nothing visible to close. It
   * closes by itself as soon as the fixed panel takes over, which already
   * shows the same data.
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
   * A click on the backdrop reaches the `<dialog>` itself, but so does one
   * that lands on its padding: without checking where it landed, touching
   * the edge of the sheet would close it (and on a sheet anchored at the
   * bottom that edge is exactly where the finger goes).
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
      // `contact-sheet` is the slide in and out: it lives in `app/globals.css`
      // because it needs `@starting-style`, and there it enters from the
      // bottom or from the right depending on which edge the sheet hangs from.
      //
      // In landscape there is no height to share out —the bottom sheet showed
      // two fields per screenful— but width to spare: it moves to the right
      // edge, top to bottom, and the data is laid out in two columns
      // (`ContactPanel`).
      //
      // The scroll padding is what reserves room for the two sticky strips:
      // when tabbing, the browser only scrolls until the field enters the
      // sheet, and without this the last one was left under the save button,
      // focused and out of sight. They are their heights: at the top, the
      // close button (44px) plus its padding (16); at the bottom, the save
      // button (44) plus its own (8 above and 16 below).
      className="contact-sheet fixed bottom-0 left-0 right-0 top-auto m-0 max-h-[82dvh] w-full max-w-none overflow-y-auto rounded-t-3xl border-t border-ink/10 bg-backdrop p-6 text-ink shadow-2xl backdrop:bg-black/50 phone-landscape:left-auto phone-landscape:top-0 phone-landscape:h-dvh phone-landscape:max-h-none phone-landscape:w-[min(40rem,76vw)] phone-landscape:scroll-pt-15 phone-landscape:scroll-pb-17 phone-landscape:rounded-l-3xl phone-landscape:rounded-tr-none phone-landscape:border-l phone-landscape:border-t-0 phone-landscape:p-4 lg:hidden"
    >
      <div className="mx-auto flex max-w-md flex-col gap-6 phone-landscape:max-w-none phone-landscape:gap-3">
        {/* With the sheet running top to bottom, the title and the close
            button stay in view even when scrolling through the data. The
            negative offset and the own padding are there to cover the edge
            of the sheet: that is where the data would show through when
            passing behind. */}
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
