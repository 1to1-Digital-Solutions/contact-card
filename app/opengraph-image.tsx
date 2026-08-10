import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { BRAND, CARD, LOGO, THEMES } from "@/lib/brand";
import { contactIn } from "@/lib/contact";
import { DEFAULT_LANGUAGE } from "@/lib/i18n";
import { DEFAULT_THEME } from "@/lib/theme";

/**
 * Previsualización al compartir el enlace (WhatsApp, LinkedIn, Slack). Se
 * genera desde el código, como las caras de la tarjeta: el contenido sale de
 * `lib/contact.ts` y el color de `lib/brand.ts`, así que no puede
 * desincronizarse de la marca. El mismo fichero sirve para Twitter/X, que lo
 * reexporta desde `app/twitter-image.tsx`.
 *
 * Es una sola imagen y la página tiene dos temas, así que va con el de
 * partida (`DEFAULT_THEME`, hoy el oscuro): el que se ve al abrir el enlace.
 *
 * Y va en un solo idioma, el de recurso, por la misma razón y una más: el
 * único texto de la imagen que se traduce es el cargo (el nombre, la empresa
 * y los datos se escriben igual), y una previsualización no se negocia. Quien
 * la pide es el servicio de mensajería, que no manda el idioma de nadie y
 * cachea una sola imagen por URL para todos los que ven el mensaje: dos
 * imágenes no llegarían a quien toca.
 *
 * El `alt` va con ella y no con la página: describe lo que pone la imagen, así
 * que se queda en el idioma en el que está escrita. Traducirlo describiría en
 * inglés un cargo que en la imagen está en español.
 */

const CONTACT = contactIn(DEFAULT_LANGUAGE);

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `Tarjeta de contacto de ${CONTACT.name}, ${CONTACT.jobTitle} de ${CONTACT.company}, con su email, su teléfono y su web.`;

/**
 * El tema de partida de la página, no el oscuro por su nombre: si mañana la
 * página abriera en claro, la previsualización se mudaría con ella.
 */
const PALETTE = THEMES[DEFAULT_THEME];

/** Margen de fondo alrededor de la tarjeta: el color de la escena hace de mesa. */
const MARGIN = 40;
const CARD_WIDTH = size.width - MARGIN * 2;

/**
 * Las medidas de dentro van en tanto por uno del ancho de la tarjeta, con las
 * mismas proporciones que la versión plana (`card-fallback.tsx`, en `cqw`):
 * margen 5.8%, filete 1%, nombre 5.8%, cargo 3.2%, empresa 2.5% y datos 3.4%.
 */
const of = (ratio: number) => Math.round(CARD_WIDTH * ratio);

/** El logotipo del reverso, en verde de marca, al 20% del ancho de la tarjeta. */
const LOGO_WIDTH = of(0.2);

/**
 * El logotipo oficial, incrustado en la imagen: el generador no resuelve rutas
 * públicas, así que el SVG viaja como data URI.
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
            // El canto del papel es lo que separa la tarjeta del fondo: los dos
            // tonos son casi el mismo, como en la escena.
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
