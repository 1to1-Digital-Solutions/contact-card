/**
 * Gestos que dan la vuelta a la tarjeta sin pasar por los botones: dos
 * toques rápidos sobre ella y sacarla de la pantalla arrastrándola.
 *
 * Son funciones puras sobre coordenadas de pantalla, marcas de tiempo y
 * medidas de mundo para poder probarlas sin montar la escena 3D. El
 * componente solo decide cuándo preguntar.
 */

/**
 * Un toque: qué dedo lo dio, dónde cayó —en píxeles de pantalla— y cuándo,
 * en milisegundos.
 */
export type PointerMark = {
  pointerId: number;
  x: number;
  y: number;
  time: number;
};

/**
 * Un toque cuenta como tal si es corto y queda quieto: por debajo de estos
 * umbrales cabe el temblor del dedo, por encima el usuario está arrastrando
 * la tarjeta y no pidiendo nada.
 */
const TAP = { maxDuration: 350, maxDistance: 16 };

/**
 * Dos toques valen por uno doble si van seguidos y caen casi en el mismo
 * sitio. La ventana es la que dan por buena las plataformas para el doble
 * toque (medio segundo largo): con menos, un dedo normal se queda fuera. La
 * distancia es mayor que la de un solo toque porque el dedo se levanta y
 * vuelve, y no aterriza dos veces en el mismo píxel.
 */
const DOUBLE_TAP = { maxGap: 450, maxDistance: 44 };

/**
 * Parte del lado de la tarjeta que debe seguir dentro de la vista para
 * considerarla en pantalla. Se pide un cuarto y no la nada porque con el
 * dedo no se puede empujar la tarjeta más allá del borde: lo que asoma a
 * partir de ahí ya se lee como que la tarjeta se ha ido.
 */
const MIN_VISIBLE_SHARE = 0.25;

/** Tarjeta en coordenadas de mundo: su centro y sus medios lados. */
export type CardBox = {
  x: number;
  y: number;
  halfWidth: number;
  halfHeight: number;
};

/** Mitad del ancho y del alto visibles, en las mismas unidades de mundo. */
export type ViewBox = {
  halfWidth: number;
  halfHeight: number;
};

function distance(a: PointerMark, b: PointerMark): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Se exige el mismo dedo en los dos extremos: con dos dedos apoyados sobre
 * la tarjeta, el segundo pisa la marca del primero, y sin esta comprobación
 * el `pointerup` de uno se mediría contra el `pointerdown` del otro.
 */
export function isTap(down: PointerMark, up: PointerMark): boolean {
  return (
    down.pointerId === up.pointerId &&
    up.time - down.time <= TAP.maxDuration &&
    distance(down, up) <= TAP.maxDistance
  );
}

/**
 * Aquí no se compara el dedo: en una pantalla táctil cada toque estrena
 * `pointerId`, así que exigirlo dejaría el doble toque solo para el ratón.
 */
export function isDoubleTap(previous: PointerMark | null, tap: PointerMark): boolean {
  if (!previous) return false;
  return (
    tap.time - previous.time <= DOUBLE_TAP.maxGap &&
    distance(previous, tap) <= DOUBLE_TAP.maxDistance
  );
}

/** Qué hacer al terminar un toque, y con qué toque se queda la memoria. */
export type TapReading = {
  /** ¿Toca dar media vuelta a la tarjeta? */
  flip: boolean;
  /** Último toque completado, o `null` si la cuenta vuelve a empezar. */
  lastTap: PointerMark | null;
};

/**
 * Lee el gesto que acaba de terminar sobre la tarjeta.
 *
 * `down` es opcional porque el mismo `pointerup` entra varias veces en el
 * manejador —una por cada malla que atraviesa el rayo— y el componente
 * consume la marca al leerla: las entregas siguientes llegan sin ella y no
 * deben contar. Lo que no llega a toque (un arrastre) deja la memoria como
 * estaba, y el segundo de un par la vacía para que un tercer toque empiece
 * cuenta nueva en vez de dar media vuelta más.
 */
export function readTap(
  down: PointerMark | null,
  up: PointerMark,
  previous: PointerMark | null,
): TapReading {
  if (!down || !isTap(down, up)) return { flip: false, lastTap: previous };
  if (isDoubleTap(previous, up)) return { flip: true, lastTap: null };
  return { flip: false, lastTap: up };
}

/**
 * Parte de un lado que cae dentro de la vista, de 0 (fuera) a 1 (entero).
 * Se mide contra el solapamiento máximo posible —el menor de los dos
 * lados— para que un lado más largo que la pantalla no cuente como fuera.
 */
function visibleShare(center: number, half: number, viewHalf: number): number {
  const span = Math.min(2 * half, 2 * viewHalf);
  if (span <= 0) return 1;

  const overlap = Math.min(center + half, viewHalf) - Math.max(center - half, -viewHalf);
  return Math.min(Math.max(overlap / span, 0), 1);
}

/**
 * ¿La tarjeta se ha salido de la vista? Basta con que se vaya por un eje.
 * Se mide con el rectángulo sin girar: mientras gira ocupa menos, así que
 * el criterio peca de prudente y nunca dispara antes de tiempo.
 */
export function hasLeftView(card: CardBox, view: ViewBox): boolean {
  return (
    visibleShare(card.x, card.halfWidth, view.halfWidth) < MIN_VISIBLE_SHARE ||
    visibleShare(card.y, card.halfHeight, view.halfHeight) < MIN_VISIBLE_SHARE
  );
}
