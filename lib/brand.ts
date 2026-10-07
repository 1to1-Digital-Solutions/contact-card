/**
 * Brand tokens for 1to1 Digital Solutions.
 *
 * The values come from the official palette: the green scale (primary-200
 * `#1ac89a`, primary-300 `#1f957a`, primary-500 `#116e57`), the `--on-primary`
 * `#1c1c1f` and the neutrals of the dark (`#27272a`, `#1e1e21`, `#ededed`)
 * and light (`#f4f4f5`, `#ffffff`, `#1a1a1a`) themes. The brand defines no
 * intermediate greys for secondary text or for the card edge: they are
 * derived from the official neutrals and pinned at the step that meets
 * WCAG AA (`brand.test.ts` checks every colour/background pair, theme by
 * theme).
 *
 * The values live here in JS because three.js cannot read CSS variables;
 * the same names are duplicated in `app/globals.css` for Tailwind, and both
 * must be changed together.
 */

/** The two colours that do not depend on the theme: the brand green and its ink. */
export const BRAND = {
  /** Brand accent (primary-300). For graphics: as text it falls short of AA. */
  accent: "#1f957a",
  /** Text over the brand green (the brand's `--on-primary`). */
  onAccent: "#1c1c1f",
} as const;

export type ThemeName = "light" | "dark";

/** The colours that change with the theme. Same names in `app/globals.css`. */
export type ThemePalette = {
  /** Background of the scene and of the page. */
  backdrop: string;
  /** Body of the card. Both faces share the same colour. */
  card: string;
  /** Edge of the card: the face shifted one step, like the cut of the paper. */
  cardEdge: string;
  /** Main text, both over the card and over the backdrop. */
  ink: string;
  /** Secondary text: the ink dimmed down to the step that still meets AA. */
  inkMuted: string;
  /** Accent readable as text in this theme (primary-200 / primary-500). */
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

/** A brand artwork: its file and the canvas it is scaled with. */
export type BrandArtwork = {
  readonly src: string;
  readonly width: number;
  readonly height: number;
};

/**
 * Official brand artworks, the only ones not generated here: the files are
 * the same ones the website uses, cropped to the logo's canvas (all three
 * draw the same path and only the ink changes). The dimensions are there to
 * scale them without distortion (`brand.test.ts` checks it).
 *
 * - `brand` carries the stroke in green: it is the one on the back, in both
 *   themes.
 * - `positive` and `negative` are the same logo in ink and in white: the
 *   watermark on the front uses whichever reads over each theme's face.
 * - `isotype` is just the symbol. It is not drawn on the card: it is the
 *   source of the favicon `app/icon.svg`, which copies its paths by hand.
 */
export const LOGO = {
  brand: { src: "/logo-brand.svg", width: 246, height: 133 },
  positive: { src: "/logo-positive.svg", width: 246, height: 133 },
  negative: { src: "/logo-negative.svg", width: 246, height: 133 },
  isotype: { src: "/isotype.svg", width: 188, height: 188 },
} as const satisfies Record<string, BrandArtwork>;

/** The watermark on the front: the ink that reads over the theme's face. */
export const WATERMARK: Record<ThemeName, BrandArtwork> = {
  light: LOGO.positive,
  dark: LOGO.negative,
};

/** Physical proportions of a standard business card (85 × 55 mm). */
export const CARD = {
  width: 3.2,
  height: (3.2 * 55) / 85,
  thickness: 0.045,
  /** Corner radius, in the same units as the width. */
  radius: 0.09,
} as const;
