"use client";

import Image from "next/image";
import { useState } from "react";
import { LOGO, WATERMARK } from "@/lib/brand";
import { contactIn, PROFILES } from "@/lib/contact";
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
  const { controls: t, fields: labels } = dictionary(language);
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
                thickness. Sizes are in `cqw` —hundredths of the card's
                width— so the whole face scales with the card. The numbers are
                the millimetres of the printed card (`scripts/print-cards.mjs`)
                over its 85 mm of width: 1 mm is 1.18 cqw. The 3D face
                (`card-textures.ts`) is laid out from the same millimetres. */}
            <span className="paper-grain absolute inset-0 flex flex-col overflow-hidden rounded-2xl border border-ink/10 border-l-[1.9cqw] border-l-accent bg-card px-[7.3cqw] pt-[7.3cqw] pb-[5.9cqw] text-left shadow-2xl [backface-visibility:hidden]">
              {/* The glow of the brand green in the top-right corner, like
                  the one behind the landing's hero: its centre sits just off
                  the card. */}
              <span className="absolute -top-[26.8cqw] -right-[26.8cqw] block size-[61.2cqw] rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--accent)_22%,transparent)_0%,color-mix(in_srgb,var(--accent)_9%,transparent)_40%,transparent_70%)]" />
              <span className="relative block font-heading text-[5.4cqw] leading-none font-bold tracking-[-0.01em] text-ink">
                {contact.name}
              </span>
              <span className="relative mt-[0.85cqw] block text-[3.1cqw] leading-none text-ink-muted">
                {contact.jobTitle}
              </span>
              {/* The tagline is what the card says: semibold italic in the
                  brand green, on one line across the text area. The company
                  name is not written out: the watermark and the back say it. */}
              <span className="relative mt-[1.95cqw] block text-[2.95cqw] leading-none font-semibold whitespace-nowrap text-accent-ink italic">
                {contact.tagline}
              </span>
              <span className="relative mt-[3.4cqw] block h-[0.18cqw] w-full bg-ink-muted/30" />
              {/* Four fields anchored to the bottom, label and value close
                  together with clear air between fields. */}
              <span className="relative mt-auto flex flex-col gap-[2.2cqw]">
                {[
                  [labels.email, contact.email],
                  [labels.phone, contact.phone],
                  [labels.website, contact.website],
                  // The LinkedIn profile, as on the 3D face: the first of
                  // the profiles is the one that goes on the card.
                  [PROFILES[0].name, PROFILES[0].address],
                ].map(([label, value]) => (
                  <span key={label} className="flex flex-col gap-[0.7cqw]">
                    <span className="text-[1.9cqw] leading-none font-semibold tracking-[0.18em] text-ink-muted uppercase">
                      {label}
                    </span>
                    <span className="text-[3.3cqw] leading-none text-ink">{value}</span>
                  </span>
                ))}
              </span>
              {/* The watermark: the logo in the ink that reads over each
                  theme's face, at the foot of the gap the text leaves. */}
              <Image
                src={WATERMARK.dark.src}
                alt=""
                width={WATERMARK.dark.width}
                height={WATERMARK.dark.height}
                unoptimized
                className="absolute right-[7.3cqw] bottom-[14.9cqw] hidden h-auto w-[23.5cqw] opacity-10 dark:block"
              />
              <Image
                src={WATERMARK.light.src}
                alt=""
                width={WATERMARK.light.width}
                height={WATERMARK.light.height}
                unoptimized
                className="absolute right-[7.3cqw] bottom-[14.9cqw] block h-auto w-[23.5cqw] opacity-10 dark:hidden"
              />
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
