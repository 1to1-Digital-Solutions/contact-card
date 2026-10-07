import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { BRAND, THEMES } from "@/lib/brand";
import { contactIn, TRANSLATED } from "@/lib/contact";
import { DEFAULT_LANGUAGE } from "@/lib/i18n";
import { buildMetadata } from "@/lib/metadata";
import { DEFAULT_THEME } from "@/lib/theme";
import Image, { alt, contentType, size } from "./opengraph-image";
import * as twitter from "./twitter-image";

/**
 * The preview when sharing is the first thing seen of the link and there is
 * no browser to check it: here it is actually generated and its pixels are
 * inspected. What is checked is that the color comes from the brand palette
 * —no hand-written tone— and that the metadata declaring it is still in
 * place.
 */

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

/** The image is generated once: rendering goes through WebAssembly and is not free. */
const png = Buffer.from(await (await Image()).arrayBuffer());

type Bitmap = {
  width: number;
  height: number;
  counts: Map<string, number>;
  /** The color of a pixel, in the same notation as the palette. */
  at: (x: number, y: number) => string;
};

/**
 * Decodes the PNG into a color count. There is no image library in the
 * project and none is needed: it is enough to read the header, decompress
 * the data and undo each scanline's filter (PNG, RFC 2083 §6), which is what
 * separates the raw bytes from the pixels.
 */
function decodePng(bytes: Buffer): Bitmap {
  expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);

  let header: { width: number; height: number; depth: number; color: number } | undefined;
  const chunks: Buffer[] = [];
  for (let at = 8; at < bytes.length; ) {
    const length = bytes.readUInt32BE(at);
    const type = bytes.toString("ascii", at + 4, at + 8);
    const data = bytes.subarray(at + 8, at + 8 + length);
    if (type === "IHDR") {
      header = {
        width: data.readUInt32BE(0),
        height: data.readUInt32BE(4),
        depth: data[8],
        color: data[9],
      };
    }
    if (type === "IDAT") chunks.push(data);
    // Each chunk carries 4 bytes of length, 4 of type and 4 of checksum.
    at += 12 + length;
  }

  expect(header).toBeDefined();
  const { width, height, depth, color } = header!;
  // The generator writes 8-bit truecolor with alpha; the other combinations
  // the format allows could not be read here.
  expect([depth, color]).toEqual([8, 6]);

  const CHANNELS = 4;
  const stride = width * CHANNELS;
  const raw = inflateSync(Buffer.concat(chunks));
  const pixels = Buffer.alloc(height * stride);

  for (let y = 0, at = 0; y < height; y++) {
    const filter = raw[at++];
    for (let i = 0; i < stride; i++) {
      const left = i >= CHANNELS ? pixels[y * stride + i - CHANNELS] : 0;
      const up = y > 0 ? pixels[(y - 1) * stride + i] : 0;
      const corner = i >= CHANNELS && y > 0 ? pixels[(y - 1) * stride + i - CHANNELS] : 0;
      pixels[y * stride + i] = (raw[at + i] + undoFilter(filter, left, up, corner)) & 255;
    }
    at += stride;
  }

  const counts = new Map<string, number>();
  for (let i = 0; i < pixels.length; i += CHANNELS) {
    const hex = `#${pixels.subarray(i, i + 3).toString("hex")}`;
    counts.set(hex, (counts.get(hex) ?? 0) + 1);
  }

  const at = (x: number, y: number) => {
    const i = y * stride + x * CHANNELS;
    return `#${pixels.subarray(i, i + 3).toString("hex")}`;
  };
  return { width, height, counts, at };
}

/** What the scanline's filter subtracted from the pixel: its neighbors, by type. */
function undoFilter(filter: number, left: number, up: number, corner: number): number {
  switch (filter) {
    case 0:
      return 0;
    case 1:
      return left;
    case 2:
      return up;
    case 3:
      return (left + up) >> 1;
    case 4: {
      // Paeth: keeps the neighbor that strays least from the sum of the three.
      const estimate = left + up - corner;
      const [dLeft, dUp, dCorner] = [left, up, corner].map((v) =>
        Math.abs(estimate - v),
      );
      if (dLeft <= dUp && dLeft <= dCorner) return left;
      return dUp <= dCorner ? up : corner;
    }
    default:
      throw new Error(`Unknown PNG filter: ${filter}`);
  }
}

const image = decodePng(png);
const PIXELS = image.width * image.height;

/** The theme the page opens with, which is the one the image is about. */
const THEME = THEMES[DEFAULT_THEME];

/** The image goes in a single language, the fallback one: it is the one its texts carry. */
const CONTACT = contactIn(DEFAULT_LANGUAGE);
const metadata = buildMetadata(DEFAULT_LANGUAGE);

/** The tokens the image is entitled to paint: the palette and nothing else. */
const PALETTE = new Set<string>([...Object.values(BRAND), ...Object.values(THEME)]);

describe("Open Graph image", () => {
  it("is a PNG of the size the metadata declares", () => {
    expect(size).toEqual({ width: 1200, height: 630 });
    expect(contentType).toBe("image/png");
    expect([image.width, image.height]).toEqual([size.width, size.height]);
  });

  /**
   * The threshold leaves out the anti-aliasing of the text edges and of the
   * rounded corners, which are blends of the neighboring colors: what is
   * watched is that no real surface comes from an invented tone.
   */
  it("paints no surface with a color from outside the palette", () => {
    const painted = [...image.counts]
      .filter(([, count]) => count >= PIXELS * 0.005)
      .map(([hex]) => hex);

    expect(painted.length).toBeGreaterThan(0);
    for (const hex of painted) expect(PALETTE).toContain(hex);
  });

  /** Each token that draws something recognizable: if one disappears, the design changed. */
  const drawn: Array<[string, string]> = [
    [THEME.backdrop, "the scene background around the card"],
    [THEME.card, "the card face"],
    [THEME.cardEdge, "the edge that separates it from the background"],
    [THEME.ink, "the name and the data"],
    [THEME.inkMuted, "the job title and the tagline"],
    [THEME.accentInk, "the company"],
    [BRAND.accent, "the hairline and the logo"],
  ];

  it.each(drawn)("paints %s: %s", (hex) => {
    expect(image.counts.get(hex) ?? 0).toBeGreaterThan(0);
  });

  /**
   * The green is also in the logo, so the token's presence is not enough to
   * know the hairline is still there: it is looked for where it lives. At
   * mid-height the card's edge is straight, so the first thing that appears
   * when coming in from the left edge has to be the hairline.
   */
  it("carries the brand hairline on the card's left edge", () => {
    const middle = Math.round(image.height / 2);
    let x = 0;
    while (x < image.width && image.at(x, middle) === THEME.backdrop) x++;

    expect(x).toBeGreaterThan(0);
    expect(x).toBeLessThan(image.width);
    expect(image.at(x, middle)).toBe(BRAND.accent);
  });

  it("is about the starting theme, which is the one the page opens with", () => {
    const dominant = [...image.counts].sort((a, b) => b[1] - a[1])[0][0];
    expect(dominant).toBe(THEME.card);
  });

  /** As with the favicon and the `themeColor`: colors are requested from the palette. */
  it("carries no hand-written color", () => {
    expect(source("./opengraph-image.tsx").match(/#[0-9a-f]{6}\b/gi)).toBeNull();
  });

  /**
   * The other side of the same deal: the texts are not copied either. If a
   * value appeared written here, changing it in `lib/contact.ts` would leave
   * the preview showing the old one, which is exactly what must not happen.
   */
  it("carries no hand-written contact data", () => {
    const code = source("./opengraph-image.tsx");
    const data = [
      ...Object.values(CONTACT),
      ...Object.values(TRANSLATED).flatMap((byLanguage) => Object.values(byLanguage)),
    ];
    for (const value of data) expect(code).not.toContain(value);
  });
});

describe("preview metadata", () => {
  it("describes the image with the contact's data, not with a loose text", () => {
    expect(alt).toContain(CONTACT.name);
    expect(alt).toContain(CONTACT.jobTitle);
    expect(alt).toContain(CONTACT.company);
    // The tagline is seen in the image: whoever cannot see it has to find
    // out all the same.
    expect(alt).toContain(CONTACT.tagline);
  });

  it("gives Twitter/X the same image as Open Graph", () => {
    expect(twitter.default).toBe(Image);
    expect([twitter.alt, twitter.contentType, twitter.size]).toEqual([
      alt,
      contentType,
      size,
    ]);
  });

  it("asks for the large card, which is the one that shows the whole image", () => {
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
  });

  /** The image is declared by the file convention: if it were also listed by
   *  hand in `openGraph.images`, there would be two and the hand-written one
   *  would win. */
  it("does not declare the image by hand in the metadata", () => {
    expect(metadata.openGraph).not.toHaveProperty("images");
    expect(metadata.twitter).not.toHaveProperty("images");
  });

  it("points the preview to the same URL as the canonical", () => {
    expect(metadata.openGraph).toMatchObject({ url: metadata.alternates?.canonical });
  });
});
