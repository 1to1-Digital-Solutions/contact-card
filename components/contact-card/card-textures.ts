import * as THREE from "three";
import {
  type BrandArtwork,
  type ThemeName,
  type ThemePalette,
  BRAND,
  CARD,
  LOGO,
  WATERMARK,
} from "@/lib/brand";
import { type Contact, type ContactData, PROFILES } from "@/lib/contact";
import type { Dictionary } from "@/lib/dictionary";

/**
 * The two faces of the card are drawn on a 2D canvas at runtime instead of
 * being loaded as images: that way the content comes from `lib/contact.ts`
 * (a single source of truth), the color comes from the theme and there is no
 * image of the text to keep in sync. The only exceptions are the brand
 * artwork in `LOGO`, which are the official files and are not redrawn.
 */

/** Resolution of the long side. 2048 keeps the text crisp on HiDPI screens. */
const W = 2048;
const H = Math.round((W * CARD.height) / CARD.width);
const RADIUS_PX = (CARD.radius / CARD.width) * W;
const PAD = 150;

/**
 * Pixels per millimetre of the real card. The front is laid out in the
 * millimetres of the printed one (`scripts/print-cards.mjs`), so the two are
 * the same card: a measure changed there is changed here with the same number.
 */
const MM = W / 85;
const mm = (value: number) => Math.round(value * MM);
/** Points to pixels: the printed card sets its type in points. */
const pt = (value: number) => mm((value * 25.4) / 72);

/**
 * The page's type (`app/globals.css`): Inter for the text, Outfit for the
 * name. Both are self-hosted, and `whenTypeReady` is what makes the faces
 * wait for them.
 */
const TEXT_STACK =
  'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const HEADING_STACK = `Outfit, ${TEXT_STACK}`;

type Ctx = CanvasRenderingContext2D;

function font(
  size: number,
  weight = 400,
  { family = TEXT_STACK, italic = false }: { family?: string; italic?: boolean } = {},
) {
  return `${italic ? "italic " : ""}${weight} ${size}px ${family}`;
}

/** The faces the front is drawn with, as the canvas asks for them. */
const TYPE_NEEDED = [
  `700 ${pt(13)}px Outfit`,
  `400 ${pt(8)}px Inter`,
  `600 ${pt(8)}px Inter`,
];

/** Whether the browser already has the page's type, so the first drawing is the final one. */
function typeReady(): boolean {
  if (typeof document === "undefined" || !document.fonts?.check) return true;
  return TYPE_NEEDED.every((face) => document.fonts.check(face));
}

/**
 * Resolves when the page's type is loaded. Where the browser cannot say,
 * it resolves at once: the face is drawn with whatever is at hand.
 */
function whenTypeReady(): Promise<void> {
  if (typeof document === "undefined" || !document.fonts?.load) return Promise.resolve();
  return Promise.all(TYPE_NEEDED.map((face) => document.fonts.load(face))).then(() => undefined);
}

/** `letterSpacing` does not exist in every browser; without it the text comes out the same, just tighter. */
function setTracking(ctx: Ctx, px: number) {
  if ("letterSpacing" in ctx) ctx.letterSpacing = `${px}px`;
}

/** Side of the noise tile. A small one is enough: it repeats. */
const GRAIN_TILE = 256;
/** How many times the tile fits across the card's width: sets the grain size. */
const GRAIN_REPEAT = 7;

/** How far each noise point strays from mid-gray. */
const GRAIN_SPREAD = 64;
/** How strongly the face is veiled with the noise. */
const GRAIN_ALPHA = 0.045;

let grainTile: HTMLCanvasElement | null = null;

/**
 * Noise tile around mid-gray. Swinging both ways is what makes the same
 * grain show both on a light face and on a dark one: veiled at low opacity,
 * some points lighten and others darken. It is generated once and shared
 * between the two faces and the material's relief.
 */
function getGrainTile(): HTMLCanvasElement {
  if (grainTile) return grainTile;

  const canvas = document.createElement("canvas");
  canvas.width = GRAIN_TILE;
  canvas.height = GRAIN_TILE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("The browser does not allow drawing on a 2D canvas");

  const image = ctx.createImageData(GRAIN_TILE, GRAIN_TILE);
  for (let i = 0; i < image.data.length; i += 4) {
    const tone = 128 + Math.round((Math.random() * 2 - 1) * GRAIN_SPREAD);
    image.data[i] = tone;
    image.data[i + 1] = tone;
    image.data[i + 2] = tone;
    image.data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);

  grainTile = canvas;
  return canvas;
}

/**
 * Paper relief for the material: the same noise, repeated, acts as the bump
 * map. It is what breaks the flat reflection and leaves the surface matte
 * and textured when turned against the light. The number of repetitions
 * along the height comes from the card's aspect ratio so the grain does not
 * come out stretched.
 */
export function createGrainTexture(): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(getGrainTile());
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(GRAIN_REPEAT, GRAIN_REPEAT / (CARD.width / CARD.height));
  return texture;
}

/** Veils the face with the grain so the color does not come out print-flat. */
function drawGrain(ctx: Ctx) {
  const pattern = ctx.createPattern(getGrainTile(), "repeat");
  if (!pattern) return;

  ctx.save();
  ctx.globalAlpha = GRAIN_ALPHA;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

/**
 * Creates a face canvas with the corners already clipped: whatever falls
 * outside the radius is transparent, so the texture fits the rounded corners
 * of the 3D body instead of sticking out past them.
 */
function createFaceCanvas(background: string): { canvas: HTMLCanvasElement; ctx: Ctx } {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("The browser does not allow drawing on a 2D canvas");

  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, RADIUS_PX);
  ctx.clip();
  paintPaper(ctx, background);

  return { canvas, ctx };
}

/** The paper itself: the face's color under the grain. Repainting it is what clears a face. */
function paintPaper(ctx: Ctx, background: string) {
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, W, H);
  drawGrain(ctx);
}

function toTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/**
 * The front, in the millimetres and points of the printed card
 * (`scripts/print-cards.mjs` has the same numbers and the reasons).
 */
const FRONT = {
  /** The brand band on the left edge, thicker than a hairline so a cut inside the trim line leaves it. */
  band: 1.6,
  name: { top: 6.2, size: 13 },
  jobTitle: { top: 11.5, size: 7.5 },
  /** The size is fitted so the one line spans the text area edge to edge. */
  tagline: { top: 15.8, size: 8 },
  divider: { top: 21.3, height: 0.15 },
  /** The label is clearly smaller than the value, and the block ends closer to the bottom edge than to the sides. */
  fields: { label: 4.6, value: 8, labelToValue: 2.2, step: 6.9, bottom: 5, valueHeight: 2.85 },
  watermark: { width: 20, bottom: 6.2 + 6.5 },
  /** A soft glow of the brand green in the top-right corner, like the one behind the landing's hero. */
  glow: { diameter: 52, offset: 22.8, stops: [0.22, 0.09, 0] as const },
} as const;

/** Small-caps label above the value, in the style of a printed card. */
function drawField(
  ctx: Ctx,
  palette: ThemePalette,
  y: number,
  label: string,
  value: string,
) {
  const labelSize = pt(FRONT.fields.label);
  ctx.fillStyle = palette.inkMuted;
  ctx.font = font(labelSize, 600);
  setTracking(ctx, labelSize * 0.18);
  ctx.fillText(label.toUpperCase(), PAD, y);

  ctx.fillStyle = palette.ink;
  ctx.font = font(pt(FRONT.fields.value), 400);
  setTracking(ctx, 0);
  ctx.fillText(value, PAD, y + mm(FRONT.fields.labelToValue));
}

/** The brand green with an alpha, for the glow's gradient. */
function accentWithAlpha(alpha: number): string {
  const hex = BRAND.accent.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((at) => parseInt(hex.slice(at, at + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * The glow: a radial gradient of the brand green in the top-right corner,
 * fading out well before the text. Its centre sits just off the card, as on
 * the printed one, where it reaches into the bleed.
 */
function drawGlow(ctx: Ctx) {
  const radius = mm(FRONT.glow.diameter / 2);
  const cx = W + mm(FRONT.glow.offset) - radius;
  const cy = -mm(FRONT.glow.offset) + radius;
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  const [centre, middle, edge] = FRONT.glow.stops;
  gradient.addColorStop(0, accentWithAlpha(centre));
  gradient.addColorStop(0.4, accentWithAlpha(middle));
  gradient.addColorStop(0.7, accentWithAlpha(edge));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);
}

/** The height a brand artwork gets when painted at that width. */
function heightOf(artwork: BrandArtwork, width: number) {
  return (width * artwork.height) / artwork.width;
}

/**
 * Draws a brand artwork centered at `cx`, with the height its aspect ratio
 * gives it and the opacity requested (`alpha`, for the watermark). It is an
 * SVG loaded as an image, so the drawing arrives later: the caller must
 * refresh the texture when the promise resolves.
 */
function drawArtwork(
  ctx: Ctx,
  artwork: BrandArtwork,
  {
    cx,
    top,
    width,
    alpha = 1,
    stillWanted = () => true,
  }: { cx: number; top: number; width: number; alpha?: number; stillWanted?: () => boolean },
): Promise<void> {
  const height = heightOf(artwork, width);
  return new Promise((resolve, reject) => {
    // The dimensions go in the constructor so the SVG rasterizes at the final
    // size and not at that of its own canvas, which is much smaller.
    const image = new Image(width, height);
    image.onload = () => {
      // A face repainted in the meantime (the type arrived) has its own
      // drawing on the way: this one would land on top of it, twice as dark.
      if (!stillWanted()) return resolve();
      // The opacity is set here and not earlier: by the time the image loads,
      // the rest of the face is already painted and the context has moved on.
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.drawImage(image, cx - width / 2, top, width, height);
      ctx.restore();
      resolve();
    };
    image.onerror = () => reject(new Error(`Could not load ${artwork.src}`));
    image.src = artwork.src;
  });
}

/**
 * Front watermark: the logo in the ink that reads over the theme's face, at
 * the foot of the gap the text block leaves. It balances the visual weight
 * without competing with the data.
 */
function drawWatermark(ctx: Ctx, theme: ThemeName, stillWanted: () => boolean): Promise<void> {
  const width = mm(FRONT.watermark.width);
  return drawArtwork(ctx, WATERMARK[theme], {
    cx: W - PAD - width / 2,
    top: H - mm(FRONT.watermark.bottom) - heightOf(WATERMARK[theme], width),
    width,
    alpha: 0.1,
    stillWanted,
  });
}

/**
 * Uploads the face to the GPU right away and refreshes it when the missing
 * SVG finishes decoding. If it never arrives, the face is left without that
 * drawing but legible.
 */
function refreshWhenDrawn(
  texture: THREE.CanvasTexture,
  drawn: Promise<void>,
  whatIsMissing: string,
) {
  drawn
    .then(() => {
      texture.needsUpdate = true;
    })
    .catch((error: Error) => {
      console.error(`${whatIsMissing}:`, error);
    });
}

/**
 * Front: the contact data over the theme's paper, laid out like the printed
 * card. The watermark is painted after everything else because it is
 * asynchronous, but it covers nothing: it lands in the bottom-right corner,
 * outside the text block.
 *
 * The face is drawn at once with whatever type the browser has, so there is
 * never an empty card; if the page's type was still loading, it is drawn
 * again when it arrives. A drawing that a later one has replaced must not
 * finish on top of it, hence the generation each one carries.
 */
export function createFrontTexture(
  contact: Contact,
  palette: ThemePalette,
  theme: ThemeName,
  labels: Dictionary["fields"],
): THREE.CanvasTexture {
  const { canvas, ctx } = createFaceCanvas(palette.card);
  const texture = toTexture(canvas);
  let generation = 0;

  const paint = (): Promise<void> => {
    const mine = ++generation;
    paintPaper(ctx, palette.card);
    ctx.textBaseline = "top";

    drawGlow(ctx);

    // Brand band along the left edge.
    ctx.fillStyle = BRAND.accent;
    ctx.fillRect(0, 0, mm(FRONT.band), H);

    const nameSize = pt(FRONT.name.size);
    ctx.fillStyle = palette.ink;
    ctx.font = font(nameSize, 700, { family: HEADING_STACK });
    setTracking(ctx, -nameSize * 0.01);
    ctx.fillText(contact.name, PAD, mm(FRONT.name.top));

    // The job title, in muted ink and without small caps so it qualifies the
    // name without disputing its hierarchy.
    ctx.fillStyle = palette.inkMuted;
    ctx.font = font(pt(FRONT.jobTitle.size), 400);
    setTracking(ctx, 0);
    ctx.fillText(contact.jobTitle, PAD, mm(FRONT.jobTitle.top));

    // The tagline is what the card says: semibold italic in the brand green,
    // on ONE line that runs edge to edge of the text area. It is measured as
    // drawn and its size set to span exactly that width, whatever face the
    // browser resolved the stack to. The company name is not written out on
    // the front: the watermark and the back say it.
    const width = W - PAD * 2;
    ctx.font = font(pt(FRONT.tagline.size), 600, { italic: true });
    const measured = ctx.measureText(contact.tagline).width;
    ctx.font = font((pt(FRONT.tagline.size) * width) / measured, 600, { italic: true });
    ctx.fillStyle = palette.accentInk;
    ctx.fillText(contact.tagline, PAD, mm(FRONT.tagline.top));

    // The divider sits halfway between the tagline and the first field.
    ctx.fillStyle = palette.inkMuted;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(PAD, mm(FRONT.divider.top), width, Math.max(2, mm(FRONT.divider.height)));
    ctx.globalAlpha = 1;

    // Four fields anchored to the bottom: the three ways to reach them and
    // the LinkedIn profile, which is where a card handed over at an event
    // usually leads next. Label and value close together, clear air between
    // fields.
    const { fields } = FRONT;
    const step = mm(fields.step);
    const first = H - mm(fields.bottom + fields.valueHeight + fields.labelToValue) - 3 * step;
    const [linkedIn] = PROFILES;
    drawField(ctx, palette, first, labels.email, contact.email);
    drawField(ctx, palette, first + step, labels.phone, contact.phone);
    drawField(ctx, palette, first + 2 * step, labels.website, contact.website);
    drawField(ctx, palette, first + 3 * step, linkedIn.name, linkedIn.address);

    texture.needsUpdate = true;
    return drawWatermark(ctx, theme, () => mine === generation);
  };

  refreshWhenDrawn(texture, paint(), "The front of the card is left without its watermark");
  if (!typeReady()) {
    refreshWhenDrawn(
      texture,
      whenTypeReady().then(paint),
      "The front of the card is left in the fallback type",
    );
  }

  return texture;
}

/**
 * Back: the logo in brand green —the same in both themes— and the website.
 * The company name is not repeated underneath because the logo itself
 * already says it. It is the only face with no translatable text, so the
 * data that does not depend on the language is enough for it.
 */
export function createBackTexture(
  contact: ContactData,
  palette: ThemePalette,
): THREE.CanvasTexture {
  const { canvas, ctx } = createFaceCanvas(palette.card);
  const cx = W / 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = palette.inkMuted;
  ctx.font = font(34, 400);
  setTracking(ctx, 4);
  ctx.fillText(contact.website, cx, 945);

  ctx.fillStyle = BRAND.accent;
  ctx.fillRect(cx - 60, H - 90, 120, 4);

  const texture = toTexture(canvas);
  refreshWhenDrawn(
    texture,
    drawArtwork(ctx, LOGO.brand, { cx, top: 370, width: 820 }),
    "The back of the card is left without its logo",
  );

  return texture;
}
