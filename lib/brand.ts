/**
 * Tokens de marca de 1to1 Digital Solutions.
 *
 * Los valores salen de la paleta oficial: la escala verde (primary-200
 * `#1ac89a`, primary-300 `#1f957a`, primary-500 `#116e57`), el `--on-primary`
 * `#1c1c1f` y los neutros de los temas oscuro (`#27272a`, `#1e1e21`,
 * `#ededed`) y claro (`#f4f4f5`, `#ffffff`, `#1a1a1a`). La marca no define
 * grises intermedios para texto secundario ni para el canto del papel: se
 * derivan de los neutros oficiales y están fijados en el escalón que cumple
 * WCAG AA (`brand.test.ts` comprueba cada par de color y fondo, tema a tema).
 *
 * Los valores viven aquí en JS porque three.js no lee variables CSS; los
 * mismos nombres están duplicados en `app/globals.css` para Tailwind, y hay
 * que cambiar los dos a la vez.
 */

/** Los dos colores que no dependen del tema: el verde de marca y su tinta. */
export const BRAND = {
  /** Acento de marca (primary-300). Para grafismos: como texto no llega a AA. */
  accent: "#1f957a",
  /** Texto sobre el verde de marca (`--on-primary` de la marca). */
  onAccent: "#1c1c1f",
} as const;

export type ThemeName = "light" | "dark";

/** Los colores que cambian con el tema. Mismos nombres en `app/globals.css`. */
export type ThemePalette = {
  /** Fondo de la escena y de la página. */
  backdrop: string;
  /** Cuerpo de la tarjeta. Las dos caras van del mismo color. */
  card: string;
  /** Canto de la tarjeta: la cara desviada un escalón, como el corte del papel. */
  cardEdge: string;
  /** Texto principal, tanto sobre la tarjeta como sobre el fondo. */
  ink: string;
  /** Texto secundario: la tinta apagada hasta el escalón que cumple AA. */
  inkMuted: string;
  /** Acento legible como texto en este tema (primary-200 / primary-500). */
  accentInk: string;
};

export const THEMES = {
  dark: {
    backdrop: "#27272a",
    card: "#1e1e21",
    cardEdge: "#2f2f34",
    ink: "#ededed",
    inkMuted: "#b8b8bd",
    accentInk: "#1ac89a",
  },
  light: {
    backdrop: "#f4f4f5",
    card: "#ffffff",
    cardEdge: "#e2e2e6",
    ink: "#1a1a1a",
    inkMuted: "#5c5c60",
    accentInk: "#116e57",
  },
} as const satisfies Record<ThemeName, ThemePalette>;

/** Un dibujo de marca: su fichero y el lienzo con el que se escala. */
export type BrandArtwork = {
  readonly src: string;
  readonly width: number;
  readonly height: number;
};

/**
 * Dibujos oficiales de la marca, los únicos que no se generan aquí: los
 * ficheros son los mismos que usa la web, recortados al lienzo del logotipo
 * (los tres dibujan el mismo trazado y solo cambia la tinta). Las medidas
 * sirven para escalarlos sin deformarlos (`brand.test.ts` lo comprueba).
 *
 * - `brand` lleva el trazo en verde: es el del reverso, en los dos temas.
 * - `positive` y `negative` son el mismo logotipo en tinta y en blanco: la
 *   marca de agua del anverso usa el que se lee sobre la cara de cada tema.
 * - `isotype` es solo el símbolo. No se dibuja en la tarjeta: es la fuente
 *   del favicon `app/icon.svg`, que copia sus trazados a mano.
 */
export const LOGO = {
  brand: { src: "/logo-brand.svg", width: 246, height: 133 },
  positive: { src: "/logo-positive.svg", width: 246, height: 133 },
  negative: { src: "/logo-negative.svg", width: 246, height: 133 },
  isotype: { src: "/isotype.svg", width: 188, height: 188 },
} as const satisfies Record<string, BrandArtwork>;

/** La marca de agua del anverso: la tinta que se lee sobre la cara del tema. */
export const WATERMARK: Record<ThemeName, BrandArtwork> = {
  light: LOGO.positive,
  dark: LOGO.negative,
};

/** Proporciones físicas de una tarjeta de visita estándar (85 × 55 mm). */
export const CARD = {
  width: 3.2,
  height: (3.2 * 55) / 85,
  thickness: 0.045,
  /** Radio de las esquinas, en las mismas unidades que el ancho. */
  radius: 0.09,
} as const;
