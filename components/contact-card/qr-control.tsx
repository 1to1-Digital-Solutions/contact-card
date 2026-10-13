"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { dictionary } from "@/lib/dictionary";
import type { Language } from "@/lib/i18n";
import type { QrCode } from "@/lib/qr";
import { QrIcon, SceneControl } from "./scene-control";

/**
 * The QR code, for handing the card over in person: whoever is in front
 * points their camera at the screen and gets the address. It is the
 * phone-to-phone channel that works everywhere; nothing a web page can do
 * pushes a link into the phone next to it, on either platform.
 *
 * It is a real `<dialog>` like the data sheet, so Escape, the backdrop and
 * focus trapping come from the browser. Unlike the sheet it is centered and
 * shows at every size: a laptop screen can be scanned too.
 */
export function QrControl({
  language,
  code,
  url,
}: {
  language: Language;
  code: QrCode;
  url: string;
}) {
  const t = dictionary(language);
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  // A click that lands on the dialog itself and not on its content is a
  // click on the backdrop: the browser reports it against the element.
  const closeIfOutside = (event: React.MouseEvent<HTMLDialogElement>) => {
    const element = dialog.current;
    if (!element || event.target !== element) return;
    const box = element.getBoundingClientRect();
    const inside =
      event.clientX >= box.left &&
      event.clientX <= box.right &&
      event.clientY >= box.top &&
      event.clientY <= box.bottom;
    if (!inside) close();
  };

  // The address is shown without the scheme: it is what someone would type.
  const shown = url.replace(/^https?:\/\//, "");

  return (
    <>
      <SceneControl label={t.controls.showQr} icon={<QrIcon />} onClick={() => setOpen(true)} />

      <dialog
        ref={dialog}
        aria-label={t.qr.title}
        onClose={close}
        onClick={closeIfOutside}
        // `pointer-events-auto` because the dialog is rendered next to its
        // button, inside the controls band, which lets gestures through to
        // the scene with `pointer-events: none`; the top layer does not stop
        // that from being inherited.
        className="pointer-events-auto m-auto w-[min(92vw,24rem)] rounded-3xl border border-ink/10 bg-backdrop p-6 text-ink shadow-2xl backdrop:bg-black/60"
      >
        <div className="flex flex-col items-center gap-5">
          <div className="flex w-full items-start justify-between gap-4">
            <h2 className="text-lg font-semibold tracking-tight">{t.qr.title}</h2>
            <button
              type="button"
              onClick={close}
              aria-label={t.qr.close}
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

          {/* Always black on white, whatever the theme: cameras lock on to
              the standard contrast at once, and a white quiet zone around the
              symbol is part of the spec. */}
          <svg
            role="img"
            aria-label={t.qr.alt}
            viewBox={`-2 -2 ${code.size + 4} ${code.size + 4}`}
            shapeRendering="crispEdges"
            className="aspect-square w-full max-w-[18rem] rounded-xl bg-white"
          >
            <path d={code.path} fill="#000" />
          </svg>

          <p className="text-center text-sm text-ink-muted">{t.qr.hint}</p>
          <p className="text-center font-medium tracking-wide text-ink">{shown}</p>
        </div>
      </dialog>
    </>
  );
}
