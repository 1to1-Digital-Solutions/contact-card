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
import type { Contact, ContactData } from "@/lib/contact";
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

const FONT_STACK =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

type Ctx = CanvasRenderingContext2D;

function font(size: number, weight = 400) {
  return `${weight} ${size}px ${FONT_STACK}`;
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
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, W, H);
  drawGrain(ctx);

  return { canvas, ctx };
}

function toTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/** Small-caps label above the value, in the style of a printed card. */
function drawField(
  ctx: Ctx,
  palette: ThemePalette,
  y: number,
  label: string,
  value: string,
) {
  ctx.fillStyle = palette.inkMuted;
  ctx.font = font(30, 600);
  setTracking(ctx, 6);
  ctx.fillText(label.toUpperCase(), PAD, y);

  ctx.fillStyle = palette.ink;
  ctx.font = font(54, 400);
  setTracking(ctx, 0);
  ctx.fillText(value, PAD, y + 58);
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
  }: { cx: number; top: number; width: number; alpha?: number },
): Promise<void> {
  const height = heightOf(artwork, width);
  return new Promise((resolve, reject) => {
    // The dimensions go in the constructor so the SVG rasterizes at the final
    // size and not at that of its own canvas, which is much smaller.
    const image = new Image(width, height);
    image.onload = () => {
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
function drawWatermark(ctx: Ctx, theme: ThemeName): Promise<void> {
  const width = 700;
  return drawArtwork(ctx, WATERMARK[theme], {
    cx: W - PAD - width / 2,
    top: H - PAD - heightOf(WATERMARK[theme], width),
    width,
    alpha: 0.1,
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
 * Front: the contact data over the theme's paper. The watermark is painted
 * after everything else because it is asynchronous, but it covers nothing:
 * it lands in the bottom-right corner, outside the text block.
 */
export function createFrontTexture(
  contact: Contact,
  palette: ThemePalette,
  theme: ThemeName,
  labels: Dictionary["fields"],
): THREE.CanvasTexture {
  const { canvas, ctx } = createFaceCanvas(palette.card);
  ctx.textBaseline = "top";

  // Brand hairline along the left edge.
  ctx.fillStyle = BRAND.accent;
  ctx.fillRect(0, 0, 16, H);

  ctx.fillStyle = palette.ink;
  ctx.font = font(116, 600);
  setTracking(ctx, -2);
  ctx.fillText(contact.name, PAD, 230);

  // The job title, between the name and the company: in muted ink and
  // without small caps so it qualifies the name without disputing its
  // hierarchy or stepping on the green the company signs with.
  ctx.fillStyle = palette.inkMuted;
  ctx.font = font(46, 400);
  setTracking(ctx, 0);
  ctx.fillText(contact.jobTitle, PAD, 380);

  ctx.fillStyle = palette.accentInk;
  ctx.font = font(34, 600);
  setTracking(ctx, 10);
  ctx.fillText(contact.company.toUpperCase(), PAD, 460);

  // The tagline, separated from the identity block by some breathing room so
  // it reads as a sentence of its own and not as a fourth line of the name.
  // It goes in muted ink and smaller than the job title: it says what the
  // company does without taking the place of whoever signs the card. At this
  // size it fits on one line with room to spare in both languages, with more
  // than a third of the width free.
  ctx.fillStyle = palette.inkMuted;
  ctx.font = font(38, 400);
  setTracking(ctx, 0);
  ctx.fillText(contact.tagline, PAD, 560);

  ctx.fillStyle = palette.inkMuted;
  ctx.globalAlpha = 0.3;
  ctx.fillRect(PAD, 680, W - PAD * 2, 2);
  ctx.globalAlpha = 1;

  // Data block anchored to the bottom edge, with the same margin as at the top.
  const first = H - PAD - (58 + 54) - 2 * 160;
  drawField(ctx, palette, first, labels.email, contact.email);
  drawField(ctx, palette, first + 160, labels.phone, contact.phone);
  drawField(ctx, palette, first + 320, labels.website, contact.website);

  const texture = toTexture(canvas);
  refreshWhenDrawn(
    texture,
    drawWatermark(ctx, theme),
    "The front of the card is left without its watermark",
  );

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
