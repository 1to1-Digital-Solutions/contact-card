import * as THREE from "three";
import { type BrandArtwork, BRAND, CARD, LOGO } from "@/lib/brand";
import type { Contact } from "@/lib/contact";

/**
 * Las dos caras de la tarjeta se dibujan en un canvas 2D en tiempo de
 * ejecución en lugar de cargarse como imágenes: así el contenido sale de
 * `lib/contact.ts` (una sola fuente de verdad) y no hay que mantener
 * sincronizada ninguna imagen del texto. Las únicas excepciones son los
 * dibujos de marca de `LOGO` —el logotipo del reverso y el isotipo de agua
 * del anverso—, que son los ficheros oficiales y no se redibujan.
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

/** Altura que le toca a un dibujo de marca al pintarlo con ese ancho. */
function heightOf(artwork: BrandArtwork, width: number) {
  return (width * artwork.height) / artwork.width;
}

/**
 * Dibuja un dibujo de marca centrado en `cx`, con la altura que le toca por su
 * proporción y la opacidad que se le pida (`alpha`, para la marca de agua). Es
 * un SVG que se carga como imagen, así que el dibujo llega después: quien
 * llame debe refrescar la textura cuando la promesa resuelva.
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
    // Las medidas van en el constructor para que el SVG rasterice al tamaño
    // final y no al de su lienzo, que es mucho más pequeño.
    const image = new Image(width, height);
    image.onload = () => {
      // La opacidad se pone aquí y no antes: para cuando la imagen carga, el
      // resto de la cara ya está pintado y el contexto ha seguido su curso.
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.drawImage(image, cx - width / 2, top, width, height);
      ctx.restore();
      resolve();
    };
    image.onerror = () => reject(new Error(`No se pudo cargar ${artwork.src}`));
    image.src = artwork.src;
  });
}

/**
 * Isotipo de agua que equilibra el peso visual del texto a la izquierda. Va el
 * símbolo solo y no el logotipo completo: a esta opacidad el subtítulo del
 * logotipo se emborrona, y el nombre de la empresa ya está escrito arriba.
 */
function drawWatermark(ctx: Ctx): Promise<void> {
  const width = 420;
  return drawArtwork(ctx, LOGO.isotype, {
    cx: W - PAD - width / 2,
    top: H - PAD - heightOf(LOGO.isotype, width),
    width,
    alpha: 0.07,
  });
}

/**
 * Sube la cara a la GPU ya y la refresca cuando el SVG que falta termine de
 * decodificarse. Si no llega, la cara se queda sin ese dibujo pero legible.
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
 * Anverso: los datos de contacto sobre el claro del papel. El isotipo de agua
 * se pinta encima del resto por ser asíncrono, pero no tapa nada: cae en la
 * esquina inferior derecha, fuera del bloque de texto.
 */
export function createFrontTexture(contact: Contact): THREE.CanvasTexture {
  const { canvas, ctx } = createFaceCanvas(BRAND.cardFront);
  ctx.textBaseline = "top";

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

  const texture = toTexture(canvas);
  refreshWhenDrawn(
    texture,
    drawWatermark(ctx),
    "El anverso de la tarjeta se queda sin marca de agua",
  );

  return texture;
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
  refreshWhenDrawn(
    texture,
    drawArtwork(ctx, LOGO.negative, { cx, top: 370, width: 820 }),
    "El reverso de la tarjeta se queda sin logotipo",
  );

  return texture;
}
