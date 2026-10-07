import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { BRAND, CARD, LOGO, THEMES } from "@/lib/brand";
import { contactIn } from "@/lib/contact";
import { DEFAULT_LANGUAGE } from "@/lib/i18n";
import { DEFAULT_THEME } from "@/lib/theme";

/**
 * Preview when sharing the link (WhatsApp, LinkedIn, Slack). It is generated
 * from code, like the card faces: the content comes from `lib/contact.ts`
 * and the color from `lib/brand.ts`, so it cannot drift from the brand. The
 * same file serves Twitter/X, which re-exports it from
 * `app/twitter-image.tsx`.
 *
 * It is a single image and the page has two themes, so it goes with the
 * starting one (`DEFAULT_THEME`, today the dark one): the one seen when
 * opening the link.
 *
 * And it goes in a single language, the fallback one, for the same reason
 * and one more: the only texts in the image that get translated are the job
 * title and the tagline (the name, the company and the data are written the
 * same), and a preview is not negotiated. Whoever requests it is the
 * messaging service, which sends nobody's language and caches a single image
 * per URL for everyone who sees the message: two images would not reach the
 * right person.
 *
 * The `alt` goes with it and not with the page: it describes what the image
 * says, so it stays in the language the image is written in. Translating it
 * would describe in English sentences that are in Spanish in the image.
 */

const CONTACT = contactIn(DEFAULT_LANGUAGE);

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `Tarjeta de contacto de ${CONTACT.name}, ${CONTACT.jobTitle} de ${CONTACT.company}. «${CONTACT.tagline}» Con su email, su teléfono y su web.`;

/**
 * The page's starting theme, not the dark one by name: if tomorrow the page
 * opened in light, the preview would move along with it.
 */
const PALETTE = THEMES[DEFAULT_THEME];

/** Background margin around the card: the scene's color acts as the table. */
const MARGIN = 40;
const CARD_WIDTH = size.width - MARGIN * 2;

/**
 * The inner dimensions go as a fraction of the card's width, with the same
 * proportions as the flat version (`card-fallback.tsx`, in `cqw`): margin
 * 5.8%, hairline 1%, name 5.8%, job title 3.2%, company 2.5% and data 3.4%.
 */
const of = (ratio: number) => Math.round(CARD_WIDTH * ratio);

/** The back's logo, in brand green, at 20% of the card's width. */
const LOGO_WIDTH = of(0.2);

/**
 * The official logo, embedded in the image: the generator does not resolve
 * public paths, so the SVG travels as a data URI.
 */
function logoDataUri(): string {
  const svg = readFileSync(join(process.cwd(), "public", LOGO.brand.src));
  return `data:image/svg+xml;base64,${svg.toString("base64")}`;
}

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          padding: MARGIN,
          background: PALETTE.backdrop,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            padding: of(0.058),
            // The paper's edge is what separates the card from the background:
            // the two tones are almost the same, as in the scene.
            border: `2px solid ${PALETTE.cardEdge}`,
            borderLeft: `${of(0.01)}px solid ${BRAND.accent}`,
            borderRadius: of(CARD.radius / CARD.width),
            background: PALETTE.card,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: of(0.058), color: PALETTE.ink, letterSpacing: -1 }}>
              {CONTACT.name}
            </span>
            <span
              style={{
                marginTop: of(0.012),
                fontSize: of(0.032),
                color: PALETTE.inkMuted,
              }}
            >
              {CONTACT.jobTitle}
            </span>
            <span
              style={{
                marginTop: of(0.01),
                fontSize: of(0.025),
                letterSpacing: of(0.025) * 0.2,
                color: PALETTE.accentInk,
              }}
            >
              {CONTACT.company.toUpperCase()}
            </span>
            {/* The tagline makes it into the preview because it makes it onto
                the card: at this size it fits on one line with room to spare,
                and it is what lets whoever sees the shared link know what the
                company does.

                Its breathing room is smaller than on the card face: here the
                paper is far more landscape and the air left between the two
                blocks is scarce, so a larger margin would separate the
                tagline from the identity and stick it to the data, which is
                the opposite of where it belongs. */}
            <span
              style={{
                marginTop: of(0.016),
                fontSize: of(0.024),
                color: PALETTE.inkMuted,
              }}
            >
              {CONTACT.tagline}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: of(0.01),
                fontSize: of(0.034),
                color: PALETTE.ink,
              }}
            >
              <span>{CONTACT.email}</span>
              <span>{CONTACT.phone}</span>
              <span>{CONTACT.website}</span>
            </div>
            <img
              src={logoDataUri()}
              alt=""
              width={LOGO_WIDTH}
              height={(LOGO_WIDTH * LOGO.brand.height) / LOGO.brand.width}
            />
          </div>
        </div>
      </div>
    ),
    size,
  );
}
