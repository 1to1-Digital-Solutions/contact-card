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
import type { Contact } from "@/lib/contact";

/**
 * Las dos caras de la tarjeta se dibujan en un canvas 2D en tiempo de
 * ejecución en lugar de cargarse como imágenes: así el contenido sale de
 * `lib/contact.ts` (una sola fuente de verdad), el color sale del tema y no
 * hay que mantener sincronizada ninguna imagen del texto. Las únicas
 * excepciones son los dibujos de marca de `LOGO`, que son los ficheros
 * oficiales y no se redibujan.
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

/** Lado del mosaico de ruido. Basta con uno pequeño: se repite. */
const GRAIN_TILE = 256;
/** Cuántas veces cabe el mosaico a lo ancho de la tarjeta: fija el tamaño del grano. */
const GRAIN_REPEAT = 7;

/** Cuánto se aparta del gris medio cada punto del ruido. */
const GRAIN_SPREAD = 64;
/** Con cuánta fuerza se vela la cara con el ruido. */
const GRAIN_ALPHA = 0.045;

let grainTile: HTMLCanvasElement | null = null;

/**
 * Mosaico de ruido alrededor del gris medio. Que oscile en los dos sentidos
 * es lo que hace que el mismo grano se vea tanto sobre una cara clara como
 * sobre una oscura: velado con poca opacidad, unos puntos aclaran y otros
 * oscurecen. Se genera una sola vez y se reparte entre las dos caras y el
 * relieve del material.
 */
function getGrainTile(): HTMLCanvasElement {
  if (grainTile) return grainTile;

  const canvas = document.createElement("canvas");
  canvas.width = GRAIN_TILE;
  canvas.height = GRAIN_TILE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("El navegador no permite dibujar en un canvas 2D");

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
 * Relieve del papel para el material: el mismo ruido, repetido, hace de mapa
 * de relieve. Es lo que rompe el reflejo liso y deja la superficie mate y con
 * textura al girarla contra la luz. El número de repeticiones a lo alto sale
 * de la proporción de la tarjeta para que el grano no salga estirado.
 */
export function createGrainTexture(): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(getGrainTile());
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(GRAIN_REPEAT, GRAIN_REPEAT / (CARD.width / CARD.height));
  return texture;
}

/** Vela la cara con el grano para que el color no salga plano de imprenta. */
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
  drawGrain(ctx);

  return { canvas, ctx };
}

function toTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/** Etiqueta en versalitas sobre el valor, al estilo de una tarjeta impresa. */
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
 * Marca de agua del anverso: el logotipo en la tinta que se lee sobre la cara
 * del tema, al pie del hueco que deja el bloque de texto. Equilibra el peso
 * visual sin competir con los datos.
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
 * Anverso: los datos de contacto sobre el papel del tema. La marca de agua se
 * pinta encima del resto por ser asíncrona, pero no tapa nada: cae en la
 * esquina inferior derecha, fuera del bloque de texto.
 */
export function createFrontTexture(
  contact: Contact,
  palette: ThemePalette,
  theme: ThemeName,
): THREE.CanvasTexture {
  const { canvas, ctx } = createFaceCanvas(palette.card);
  ctx.textBaseline = "top";

  // Filete de marca en el canto izquierdo.
  ctx.fillStyle = BRAND.accent;
  ctx.fillRect(0, 0, 16, H);

  ctx.fillStyle = palette.ink;
  ctx.font = font(116, 600);
  setTracking(ctx, -2);
  ctx.fillText(contact.name, PAD, 230);

  ctx.fillStyle = palette.accentInk;
  ctx.font = font(34, 600);
  setTracking(ctx, 10);
  ctx.fillText(contact.company.toUpperCase(), PAD, 400);

  ctx.fillStyle = palette.inkMuted;
  ctx.globalAlpha = 0.3;
  ctx.fillRect(PAD, 680, W - PAD * 2, 2);
  ctx.globalAlpha = 1;

  // Bloque de datos anclado al borde inferior, con el mismo margen que arriba.
  const first = H - PAD - (58 + 54) - 2 * 160;
  drawField(ctx, palette, first, "Email", contact.email);
  drawField(ctx, palette, first + 160, "Teléfono", contact.phone);
  drawField(ctx, palette, first + 320, "Web", contact.website);

  const texture = toTexture(canvas);
  refreshWhenDrawn(
    texture,
    drawWatermark(ctx, theme),
    "El anverso de la tarjeta se queda sin marca de agua",
  );

  return texture;
}

/**
 * Reverso: el logotipo en verde de marca —el mismo en los dos temas— y la
 * web. El nombre de la empresa no se repite debajo porque el propio logotipo
 * ya lo dice.
 */
export function createBackTexture(
  contact: Contact,
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
    "El reverso de la tarjeta se queda sin logotipo",
  );

  return texture;
}
