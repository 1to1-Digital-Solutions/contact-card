import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { BRAND, CARD, LOGO, THEMES, WATERMARK } from "@/lib/brand";
import { contactIn, PROFILES } from "@/lib/contact";
import { dictionary } from "@/lib/dictionary";
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
const LABELS = dictionary(DEFAULT_LANGUAGE).fields;

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `Tarjeta de contacto de ${CONTACT.name}, ${CONTACT.jobTitle} de ${CONTACT.company}. «${CONTACT.tagline}». Con su email, su teléfono y su web.`;

/**
 * The page's starting theme, not the dark one by name: if tomorrow the page
 * opened in light, the preview would move along with it.
 */
const PALETTE = THEMES[DEFAULT_THEME];

/** Background margin around the card: the scene's color acts as the table. */
const MARGIN = 40;
const CARD_WIDTH = size.width - MARGIN * 2;

/**
 * The inner dimensions go as a fraction of the card's width, following the
 * printed card (`scripts/print-cards.mjs`) where the proportions allow: this
 * paper is far more landscape than a real card, so the vertical measures are
 * tightened to fit (every line at line-height 1) while the hierarchy stays
 * the same: the tagline in the brand green, the labels clearly smaller than
 * the values. The type is the generator's default, not the page's: it takes
 * TTF or OTF files and the page ships the WOFF2 subsets only, so the name
 * does not come out in Outfit here.
 */
const of = (ratio: number) => Math.round(CARD_WIDTH * ratio);

/** The brand green with an alpha, for the glow. */
function accentWithAlpha(alpha: number): string {
  const hex = BRAND.accent.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((at) => parseInt(hex.slice(at, at + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** The watermark, in the ink that reads over the starting theme's face, as on the card's front. */
const WATERMARK_WIDTH = of(0.235);

/** The four fields of the front, label and value. */
const FIELDS: Array<[string, string]> = [
  [LABELS.email, CONTACT.email],
  [LABELS.phone, CONTACT.phone],
  [LABELS.website, CONTACT.website],
  [PROFILES[0].name, PROFILES[0].address],
];

/**
 * The official logo, embedded in the image: the generator does not resolve
 * public paths, so the SVG travels as a data URI.
 */
function logoDataUri(): string {
  const svg = readFileSync(join(process.cwd(), "public", WATERMARK[DEFAULT_THEME].src));
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
            position: "relative",
            display: "flex",
            flexDirection: "column",
            width: "100%",
            padding: `${of(0.045)}px ${of(0.073)}px ${of(0.04)}px`,
            // The paper's edge is what separates the card from the background:
            // the two tones are almost the same, as in the scene.
            border: `2px solid ${PALETTE.cardEdge}`,
            borderLeft: `${of(0.019)}px solid ${BRAND.accent}`,
            borderRadius: of(CARD.radius / CARD.width),
            background: PALETTE.card,
            overflow: "hidden",
          }}
        >
          {/* The glow of the brand green in the top-right corner, as on the card. */}
          <div
            style={{
              position: "absolute",
              top: -of(0.268),
              right: -of(0.268),
              width: of(0.612),
              height: of(0.612),
              borderRadius: "50%",
              background: `radial-gradient(circle, ${accentWithAlpha(0.22)} 0%, ${accentWithAlpha(0.09)} 40%, ${accentWithAlpha(0)} 70%)`,
            }}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: of(0.054), fontWeight: 700, lineHeight: 1, color: PALETTE.ink, letterSpacing: -1 }}>
              {CONTACT.name}
            </span>
            <span style={{ marginTop: of(0.009), fontSize: of(0.031), lineHeight: 1, color: PALETTE.inkMuted }}>
              {CONTACT.jobTitle}
            </span>
            {/* The tagline is what the card says: it makes it into the
                preview in the brand green, as on the front, and it is what
                lets whoever sees the shared link know what the company
                stands for. The company name is not written out: the
                watermark says it. */}
            <span
              style={{
                marginTop: of(0.016),
                fontSize: of(0.03),
                fontWeight: 600,
                fontStyle: "italic",
                lineHeight: 1,
                color: PALETTE.accentInk,
              }}
            >
              {CONTACT.tagline}
            </span>
            <div
              style={{
                marginTop: of(0.018),
                height: 2,
                width: "100%",
                background: PALETTE.inkMuted,
                opacity: 0.3,
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginTop: "auto",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: of(0.016) }}>
              {FIELDS.map(([label, value]) => (
                <div key={label} style={{ display: "flex", flexDirection: "column", gap: of(0.007) }}>
                  <span
                    style={{
                      fontSize: of(0.016),
                      fontWeight: 600,
                      lineHeight: 1,
                      letterSpacing: of(0.016) * 0.18,
                      color: PALETTE.inkMuted,
                    }}
                  >
                    {label.toUpperCase()}
                  </span>
                  <span style={{ fontSize: of(0.028), lineHeight: 1, color: PALETTE.ink }}>{value}</span>
                </div>
              ))}
            </div>
            <img
              src={logoDataUri()}
              alt=""
              width={WATERMARK_WIDTH}
              height={(WATERMARK_WIDTH * LOGO.brand.height) / LOGO.brand.width}
              style={{ opacity: 0.1, marginBottom: of(0.03) }}
            />
          </div>
        </div>
      </div>
    ),
    size,
  );
}
