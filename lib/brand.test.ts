import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { type ThemeName, BRAND, LOGO, THEMES, WATERMARK } from "./brand";

/**
 * The brand tokens are only worth anything if the text reads over its
 * background. Pinned here is every combination that exists on the card and
 * on the page, in both themes, with the threshold each one is due: 4.5:1 for
 * text (WCAG 2.2, criterion 1.4.3 AA) and 3:1 for what is shape only
 * (1.4.11).
 */

/** sRGB channel to linear light, per the WCAG definition of relative luminance. */
function toLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const value = Number.parseInt(hex.slice(1), 16);
  return (
    0.2126 * toLinear((value >> 16) & 255) +
    0.7152 * toLinear((value >> 8) & 255) +
    0.0722 * toLinear(value & 255)
  );
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

/** Lays `top` with opacity `alpha` over `bottom`, the way the browser does. */
function blend(top: string, alpha: number, bottom: string): string {
  const t = Number.parseInt(top.slice(1), 16);
  const b = Number.parseInt(bottom.slice(1), 16);
  const channel = (shift: number) =>
    Math.round(((t >> shift) & 255) * alpha + ((b >> shift) & 255) * (1 - alpha));
  return `#${[16, 8, 0]
    .map((shift) => channel(shift).toString(16).padStart(2, "0"))
    .join("")}`;
}

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const CSS = source("../app/globals.css");

/** The declarations of one block of `app/globals.css`, by variable name. */
function declarationsIn(selector: RegExp): Map<string, string> {
  const body = CSS.match(selector)?.[1] ?? "";
  return new Map(
    [...body.matchAll(/(--[a-z-]+):\s*([^;]+);/g)].map(([, name, value]) => [
      name,
      value.trim(),
    ]),
  );
}

const BLOCKS = {
  theme: declarationsIn(/@theme inline\s*\{([\s\S]*?)\n\}/),
  shared: declarationsIn(/\n:root\s*\{([\s\S]*?)\n\}/),
  dark: declarationsIn(/:root,\n\.dark\s*\{([\s\S]*?)\n\}/),
  light: declarationsIn(/\n\.light\s*\{([\s\S]*?)\n\}/),
};

/**
 * The background is NOT plain `backdrop` where the scene's text lives: on
 * top of it sit the `body` glaze and the card's halo, which shift it (in the
 * dark theme they lighten it, in the light one they darken it). The worst
 * case is the centre of the scene (that is where "Loading the card…" and the
 * flat-version note are read): the full halo over the strongest glaze, which
 * is the only one that reaches that far (the two sit in opposite corners).
 * Both opacities and the halo's ink are read from the CSS so they cannot
 * drift out of sync.
 */
function litBackdrop(theme: ThemeName): string {
  const block = BLOCKS[theme];
  const number = (name: string) => Number(block.get(name));
  return blend(
    block.get("--halo-color")!,
    number("--halo"),
    blend(BRAND.accent, number("--glaze-b"), block.get("--backdrop")!),
  );
}

/** Text-over-background pairs, with where each one appears. */
function textPairs(theme: ThemeName): Array<[string, string, string]> {
  const { card, backdrop, ink, inkMuted, accentInk } = THEMES[theme];
  const lit = litBackdrop(theme);
  return [
    [ink, card, "name and details on the front"],
    [inkMuted, card, "job title, tagline and labels on the front, website on the back"],
    [accentInk, card, "company on the front"],
    [ink, backdrop, "panel heading and links"],
    [inkMuted, backdrop, "panel labels"],
    [accentInk, backdrop, "company in the header"],
    [BRAND.onAccent, BRAND.accent, "text of the save-contact button"],
    [ink, lit, "scene controls over the glazed backdrop"],
    [inkMuted, lit, "\"Loading the card…\" and the flat-version note"],
  ];
}

/** Elements that convey information by their shape, not by their text. */
function graphicPairs(theme: ThemeName): Array<[string, string, string]> {
  const { card, accentInk } = THEMES[theme];
  return [
    [BRAND.accent, card, "rule on the front and finishing line on the back"],
    [accentInk, litBackdrop(theme), "keyboard focus over the scene"],
    [accentInk, card, "keyboard focus over the flat card"],
  ];
}

describe("brand palette contrast", () => {
  it("measures contrast the way WCAG prescribes", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrast("#767676", "#ffffff")).toBeCloseTo(4.54, 2);
    expect(contrast("#1f957a", "#1f957a")).toBeCloseTo(1, 5);
  });

  for (const theme of ["dark", "light"] as const) {
    describe(`${theme} theme`, () => {
      it.each(textPairs(theme))("%s over %s reaches AA (%s)", (fg, bg) => {
        expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
      });

      it.each(graphicPairs(theme))("%s over %s is distinguishable (%s)", (fg, bg) => {
        expect(contrast(fg, bg)).toBeGreaterThanOrEqual(3);
      });

      it("keeps the accent vivid outside text: that is why `accentInk` exists", () => {
        expect(contrast(BRAND.accent, THEMES[theme].card)).toBeLessThan(4.5);
      });

      /** The edge is the face shifted one step, not a foreign colour: if it drifted
       *  too far apart, it would show up lit again through the rounded corners of
       *  the texture, which is exactly what was taken out of the way. */
      it("keeps the edge one step away from the face colour", () => {
        const { card, cardEdge } = THEMES[theme];
        expect(contrast(card, cardEdge)).toBeGreaterThan(1);
        expect(contrast(card, cardEdge)).toBeLessThan(1.5);
      });
    });
  }
});

/** `inkMuted` → `--ink-muted`, the name the same variable has in the CSS. */
function cssVariable(token: string): string {
  return `--${token.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
}

describe("palette duplicated in app/globals.css", () => {
  it("finds the three blocks and their declarations", () => {
    expect(BLOCKS.theme.size).toBeGreaterThan(0);
    expect(BLOCKS.dark.size).toBeGreaterThan(0);
    expect(BLOCKS.light.size).toBeGreaterThan(0);
  });

  it.each(Object.entries(BRAND))(
    "%s has the same value in `lib/brand.ts` and in the CSS",
    (token, value) => {
      expect(BLOCKS.shared.get(cssVariable(token))).toBe(value);
    },
  );

  for (const [theme, palette] of Object.entries(THEMES)) {
    it.each(Object.entries(palette))(
      `${theme}: %s has the same value in \`lib/brand.ts\` and in the CSS`,
      (token, value) => {
        expect(BLOCKS[theme as ThemeName].get(cssVariable(token))).toBe(value);
      },
    );
  }

  it("exposes in `@theme` exactly the colours `lib/brand.ts` knows", () => {
    const expected = [...Object.keys(BRAND), ...Object.keys(THEMES.dark)]
      .map(cssVariable)
      .sort();
    const declared = [...BLOCKS.theme.keys()]
      .filter((name) => name.startsWith("--color-"))
      .map((name) => name.replace("--color-", "--"))
      .sort();

    expect(declared).toEqual(expected);
  });

  it("makes the utilities point at the theme variable, not at its value", () => {
    for (const token of Object.keys(THEMES.dark)) {
      const variable = cssVariable(token);
      expect(BLOCKS.theme.get(`--color${variable.slice(1)}`)).toBe(`var(${variable})`);
    }
  });
});

/**
 * The two places that do not read the CSS: the Next metadata and the
 * favicon. The `themeColor` already comes from the palette (`CHROME_COLOR`),
 * so here we only watch that nobody writes it by hand again; the favicon, on
 * the other hand, is a static SVG and its colours really are copied.
 */
describe("colours outside the CSS", () => {
  const hexesIn = (text: string) =>
    [...text.matchAll(/#[0-9a-f]{6}\b/gi)].map(([hex]) => hex.toLowerCase());

  it("takes the `themeColor` from the palette and not from a hand-written colour", () => {
    const layout = source("../app/layout.tsx");
    expect(layout).toContain("themeColor: CHROME_COLOR[DEFAULT_THEME]");
    expect(hexesIn(layout)).toEqual([]);
  });

  it("the favicon is the brand isotype over the dark card", () => {
    const used = [...new Set(hexesIn(source("../app/icon.svg")))].sort();
    expect(used).toEqual([THEMES.dark.card, BRAND.accent].sort());
  });

  /**
   * The favicon's isotype is the official one, but its canvas is not the
   * icon's: it comes in a `viewBox` that starts at 56 and is fitted into the
   * 64 one with a hand-computed scale and offset. If either number is
   * touched, the isotype stops being centred without it showing in a 16px
   * favicon, so the arithmetic is redone here.
   */
  it("fits the isotype centred inside the favicon canvas", () => {
    const svg = source("../app/icon.svg");
    /**
     * The isotype's canvas, read from the `viewBox` of the file that holds it
     * (not from its `width`/`height`, which are something else). The
     * arithmetic below applies a single origin and a single size to both
     * axes, so the canvas has to be square and start at the same number in X
     * and in Y.
     */
    const [minX, minY, boxWidth, boxHeight] = (
      source(`../public${LOGO.isotype.src}`).match(/viewBox="([^"]+)"/)?.[1] ?? ""
    )
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    expect(minY).toBe(minX);
    expect(boxHeight).toBe(boxWidth);
    expect(boxWidth).toBe(LOGO.isotype.width);

    const ISOTYPE = { origin: minX, size: boxWidth };
    const BOX = 64;

    const scale = Number(svg.match(/scale\(([\d.]+)\)/)?.[1]);
    const offset = svg
      .match(/translate\((-?[\d.]+)[\s,]+(-?[\d.]+)\)/)
      ?.slice(1, 3)
      .map(Number);

    expect(scale).toBeGreaterThan(0);
    expect(offset).toHaveLength(2);

    const drawn = ISOTYPE.size * scale;
    const margin = (BOX - drawn) / 2;
    expect(margin).toBeGreaterThan(0);
    for (const axis of offset!) {
      expect(ISOTYPE.origin * scale + axis).toBeCloseTo(margin, 1);
    }
  });
});

/**
 * The brand artworks are the only ones not generated: they are the official
 * files, copied from the website. Here we check that they are still where
 * `LOGO` says, that they are scaled with the dimensions of their own canvas
 * (otherwise they come out distorted in the texture) and that each version
 * carries the ink that reads over the face it is used on.
 */
describe("brand artworks", () => {
  const artwork = (src: string) => new URL(`../public${src}`, import.meta.url);
  const svgOf = (src: string) => readFileSync(artwork(src), "utf8");
  /** The official SVGs name white and black instead of writing their hex. */
  const NAMED: Record<string, string> = { white: "#ffffff", black: "#000000" };
  const fillsOf = (svg: string) =>
    new Set(
      [...svg.matchAll(/fill="([^"]+)"/g)]
        .map(([, value]) => value.toLowerCase())
        .filter((value) => value !== "none")
        .map((value) => NAMED[value] ?? value),
    );
  const pathsOf = (svg: string) => [...svg.matchAll(/\sd="([^"]+)"/g)].map(([, d]) => d);

  it.each(Object.entries(LOGO))("%s is in `public/`, where it points", (_, art) => {
    expect(existsSync(artwork(art.src))).toBe(true);
  });

  it.each(Object.entries(LOGO))(
    "%s has the canvas it is scaled with",
    (_, art) => {
      const svg = svgOf(art.src);
      expect(svg).toContain(`width="${art.width}"`);
      expect(svg).toContain(`height="${art.height}"`);
    },
  );

  /** One logo with three inks: if one version is swapped for another, it stops
   *  drawing the same thing and has to be fetched from the brand again. */
  it("the three versions of the logo draw the same path", () => {
    const reference = pathsOf(svgOf(LOGO.brand.src));
    expect(reference.length).toBeGreaterThan(0);
    expect(pathsOf(svgOf(LOGO.positive.src))).toEqual(reference);
    expect(pathsOf(svgOf(LOGO.negative.src))).toEqual(reference);
  });

  it("the logo on the back is in the brand green", () => {
    expect([...fillsOf(svgOf(LOGO.brand.src))]).toEqual([BRAND.accent]);
  });

  /**
   * The logo on the back is the same in both themes, so its green has to be
   * distinguishable over both faces. As a graphic, 3:1 is enough: the text it
   * carries inside is the brand, which WCAG 1.4.3 leaves out of the text
   * threshold.
   */
  it.each(["dark", "light"] as const)(
    "the logo on the back is distinguishable over the %s face",
    (theme) => {
      expect(contrast(BRAND.accent, THEMES[theme].card)).toBeGreaterThanOrEqual(3);
    },
  );

  it.each(["dark", "light"] as const)(
    "the %s watermark on the front carries the ink that reads over that face",
    (theme) => {
      const fills = [...fillsOf(svgOf(WATERMARK[theme].src))];
      expect(fills.length).toBeGreaterThan(0);
      for (const fill of fills) {
        expect(contrast(fill, THEMES[theme].card)).toBeGreaterThanOrEqual(4.5);
      }
    },
  );

  /** The favicon's symbol comes from here: a single official artwork. */
  it("the isotype draws the same symbol as the favicon", () => {
    expect(pathsOf(svgOf(LOGO.isotype.src))).toEqual(pathsOf(source("../app/icon.svg")));
  });
});
