import * as THREE from "three";
import { BRAND, CARD, LOGO } from "@/lib/brand";
import type { Contact } from "@/lib/contact";

/**
 * Las dos caras de la tarjeta se dibujan en un canvas 2D en tiempo de
 * ejecución en lugar de cargarse como imágenes: así el contenido sale de
 * `lib/contact.ts` (una sola fuente de verdad) y no hay que mantener
 * sincronizada ninguna imagen del texto. La única excepción es el logotipo
 * del reverso, que es el fichero oficial de la marca y no se redibuja.
 */

/** Resolución de la cara larga. 2048 mantiene el texto nítido en pantallas HiDPI. */
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

/** `letterSpacing` no existe en todos los navegadores; sin él el texto sale igual, solo más junto. */
function setTracking(ctx: Ctx, px: number) {
  if ("letterSpacing" in ctx) ctx.letterSpacing = `${px}px`;
}

/**
 * Crea el canvas de una cara con las esquinas ya recortadas: lo que quede
 * fuera del radio es transparente, de modo que la textura encaja con las
 * esquinas redondeadas del cuerpo 3D en vez de sobresalir por ellas.
 */
function createFaceCanvas(background: string): { canvas: HTMLCanvasElement; ctx: Ctx } {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("El navegador no permite dibujar en un canvas 2D");

  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, RADIUS_PX);
  ctx.clip();
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, W, H);

  return { canvas, ctx };
}

function toTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/** Etiqueta en versalitas sobre el valor, al estilo de una tarjeta impresa. */
function drawField(ctx: Ctx, y: number, label: string, value: string) {
  ctx.fillStyle = BRAND.inkMuted;
  ctx.font = font(30, 600);
  setTracking(ctx, 6);
  ctx.fillText(label.toUpperCase(), PAD, y);

  ctx.fillStyle = BRAND.ink;
  ctx.font = font(54, 400);
  setTracking(ctx, 0);
  ctx.fillText(value, PAD, y + 58);
}

/**
 * Dibuja el logotipo centrado en `cx`, con la altura que le toca por su
 * proporción. Es un SVG que se carga como imagen, así que el dibujo llega
 * después: quien llame debe refrescar la textura cuando la promesa resuelva.
 */
function drawLogo(ctx: Ctx, cx: number, top: number, width: number): Promise<void> {
  const height = (width * LOGO.height) / LOGO.width;
  return new Promise((resolve, reject) => {
    // Las medidas van en el constructor para que el SVG rasterice al tamaño
    // final y no al de su lienzo, que es mucho más pequeño.
    const image = new Image(width, height);
    image.onload = () => {
      ctx.drawImage(image, cx - width / 2, top, width, height);
      resolve();
    };
    image.onerror = () => reject(new Error(`No se pudo cargar ${LOGO.src}`));
    image.src = LOGO.src;
  });
}

/** Monograma de agua que equilibra el peso visual del texto a la izquierda. */
function drawWatermark(ctx: Ctx) {
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = BRAND.ink;
  ctx.font = font(380, 600);
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  setTracking(ctx, -8);
  ctx.fillText("1:1", W - PAD + 20, H - 120);
  ctx.restore();
}

export function createFrontTexture(contact: Contact): THREE.CanvasTexture {
  const { canvas, ctx } = createFaceCanvas(BRAND.cardFront);
  ctx.textBaseline = "top";

  drawWatermark(ctx);

  // Filete de marca en el canto izquierdo.
  ctx.fillStyle = BRAND.accent;
  ctx.fillRect(0, 0, 16, H);

  ctx.fillStyle = BRAND.ink;
  ctx.font = font(116, 600);
  setTracking(ctx, -2);
  ctx.fillText(contact.name, PAD, 230);

  ctx.fillStyle = BRAND.accentInk;
  ctx.font = font(34, 600);
  setTracking(ctx, 10);
  ctx.fillText(contact.company.toUpperCase(), PAD, 400);

  ctx.fillStyle = BRAND.inkMuted;
  ctx.globalAlpha = 0.3;
  ctx.fillRect(PAD, 680, W - PAD * 2, 2);
  ctx.globalAlpha = 1;

  // Bloque de datos anclado al borde inferior, con el mismo margen que arriba.
  const first = H - PAD - (58 + 54) - 2 * 160;
  drawField(ctx, first, "Email", contact.email);
  drawField(ctx, first + 160, "Teléfono", contact.phone);
  drawField(ctx, first + 320, "Web", contact.website);

  return toTexture(canvas);
}

/**
 * Reverso: el logotipo de la marca y la web. El nombre de la empresa no se
 * repite debajo porque el propio logotipo ya lo dice.
 */
export function createBackTexture(contact: Contact): THREE.CanvasTexture {
  const { canvas, ctx } = createFaceCanvas(BRAND.cardBack);
  const cx = W / 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = BRAND.inkInverseMuted;
  ctx.font = font(34, 400);
  setTracking(ctx, 4);
  ctx.fillText(contact.website, cx, 945);

  ctx.fillStyle = BRAND.accent;
  ctx.fillRect(cx - 60, H - 90, 120, 4);

  const texture = toTexture(canvas);
  // La cara sube a la GPU sin el logotipo y se refresca cuando la imagen está
  // decodificada; si no llega, el reverso se queda sin él pero legible.
  drawLogo(ctx, cx, 370, 820)
    .then(() => {
      texture.needsUpdate = true;
    })
    .catch((error: Error) => {
      console.error("El reverso de la tarjeta se queda sin logotipo:", error);
    });

  return texture;
}
