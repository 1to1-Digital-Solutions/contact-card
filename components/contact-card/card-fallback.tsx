"use client";

import Image from "next/image";
import { useState } from "react";
import { LOGO } from "@/lib/brand";
import { contactIn } from "@/lib/contact";
import { dictionary } from "@/lib/dictionary";
import type { Language } from "@/lib/i18n";

/**
 * Flat card for when there is no WebGL or the 3D scene fails. It keeps the
 * essentials —the same design and the two faces, in the theme's color, which
 * flip with a click or with the keyboard— using CSS only. The grain that in
 * 3D comes from the material's relief is provided here by `.paper-grain`.
 *
 * The visual content is hidden from screen readers because the same data is
 * already there, as links, in the contact panel.
 */
export function CardFallback({
  note,
  language,
}: {
  note: string;
  language: Language;
}) {
  const t = dictionary(language).controls;
  const contact = contactIn(language);
  const [showingBack, setShowingBack] = useState(false);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="[perspective:1200px]">
        <button
          type="button"
          onClick={() => setShowingBack((value) => !value)}
          aria-label={showingBack ? t.flipToFront : t.flipToBack}
          // The `45dvh` is what ties it to the height and not only to the
          // width: the page no longer scrolls, so in a short viewport —a phone
          // in landscape— the flat card grew until it slid under the header
          // and the controls strip, and the text came out overlapping. On tall
          // screens it never wins: there the width keeps deciding.
          //
          // `@container` is what lets what is inside measure itself in `cqw`
          // —hundredths of the card's own width— instead of in pixels: that
          // way the printed paper shrinks as a whole, keeping its proportions,
          // instead of clipping the text when the card gets smaller.
          className="@container relative block aspect-[85/55] w-[min(90vw,26rem,45dvh)] rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-ink"
        >
          <span
            aria-hidden="true"
            className="relative block h-full w-full transition-transform duration-700 [transform-style:preserve-3d] motion-reduce:duration-0"
            style={{ transform: showingBack ? "rotateY(180deg)" : undefined }}
          >
            {/* Both faces share the same color; the edge hairline gives them
                back the silhouette that in 3D comes from the paper's
                thickness. Sizes are in `cqw` so the whole face scales with
                the card: the values are the same as before (24 px margin,
                24 px name…) translated over its maximum width, 26rem. */}
            <span className="paper-grain absolute inset-0 flex flex-col justify-between overflow-hidden rounded-2xl border border-ink/10 border-l-[1cqw] border-l-accent bg-card p-[5.8cqw] text-left shadow-2xl [backface-visibility:hidden]">
              <span>
                <span className="block text-[5.8cqw] font-semibold text-ink">
                  {contact.name}
                </span>
                <span className="mt-[1.2cqw] block text-[3.2cqw] text-ink-muted">
                  {contact.jobTitle}
                </span>
                <span className="mt-[1cqw] block text-[2.5cqw] font-semibold uppercase tracking-[0.2em] text-accent-ink">
                  {contact.company}
                </span>
                {/* The tagline, with the same breathing room above it as on
                    the 3D face: it sits apart from the identity block and
                    below it in hierarchy. Here it may wrap onto two lines
                    when the card narrows, and they fit: the gap between the
                    two blocks has room to spare even on a phone in
                    landscape, which is the shortest viewport. */}
                <span className="mt-[3cqw] block text-[2.6cqw] leading-snug text-ink-muted">
                  {contact.tagline}
                </span>
              </span>
              <span className="flex flex-col gap-[1cqw] text-[3.4cqw] text-ink">
                <span>{contact.email}</span>
                <span>{contact.phone}</span>
                <span>{contact.website}</span>
              </span>
            </span>

            <span className="paper-grain absolute inset-0 flex flex-col items-center justify-center gap-[3.8cqw] overflow-hidden rounded-2xl border border-ink/10 bg-card p-[5.8cqw] shadow-2xl [backface-visibility:hidden] [transform:rotateY(180deg)]">
              {/* The same file that draws the back in 3D, here without a
                  canvas. The `alt` is empty because both faces hang from an
                  `aria-hidden` (the data is read in the panel), and it is
                  unoptimized because it is an SVG: it is served as is. */}
              <Image
                src={LOGO.brand.src}
                alt=""
                width={LOGO.brand.width}
                height={LOGO.brand.height}
                unoptimized
                className="h-auto w-2/5"
              />
              <span className="text-[2.9cqw] text-ink-muted">{contact.website}</span>
            </span>
          </span>
        </button>
      </div>

      <p className="max-w-sm text-center text-sm text-ink-muted">{note}</p>
    </div>
  );
}
