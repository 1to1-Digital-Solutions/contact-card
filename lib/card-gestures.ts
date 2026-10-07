/**
 * Gestures that flip the card without going through the buttons: two quick
 * taps on it, and dragging it off the screen.
 *
 * They are pure functions over screen coordinates, timestamps and world
 * measurements so they can be tested without mounting the 3D scene. The
 * component only decides when to ask.
 */

/**
 * A tap: which finger made it, where it landed (in screen pixels) and when,
 * in milliseconds.
 */
export type PointerMark = {
  pointerId: number;
  x: number;
  y: number;
  time: number;
};

/**
 * A tap counts as one if it is short and stays put: below these thresholds
 * there is room for a trembling finger; above them the user is dragging the
 * card, not asking for anything.
 */
const TAP = { maxDuration: 350, maxDistance: 16 };

/**
 * Two taps count as a double tap if they come one after the other and land
 * almost in the same place. The window is the one platforms accept for a
 * double tap (a long half second): with less, an ordinary finger is left
 * out. The distance is larger than for a single tap because the finger
 * lifts and comes back, and it does not land twice on the same pixel.
 */
const DOUBLE_TAP = { maxGap: 450, maxDistance: 44 };

/**
 * Share of a card side that must remain inside the view for the card to
 * count as on screen. A quarter is required rather than nothing because a
 * finger cannot push the card past the edge: what peeks out beyond that
 * point already reads as the card having gone.
 */
const MIN_VISIBLE_SHARE = 0.25;

/** The card in world coordinates: its centre and its half sides. */
export type CardBox = {
  x: number;
  y: number;
  halfWidth: number;
  halfHeight: number;
};

/** Half of the visible width and height, in the same world units. */
export type ViewBox = {
  halfWidth: number;
  halfHeight: number;
};

function distance(a: PointerMark, b: PointerMark): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * The same finger is required at both ends: with two fingers resting on the
 * card, the second overwrites the mark of the first, and without this check
 * the `pointerup` of one would be measured against the `pointerdown` of the
 * other.
 */
export function isTap(down: PointerMark, up: PointerMark): boolean {
  return (
    down.pointerId === up.pointerId &&
    up.time - down.time <= TAP.maxDuration &&
    distance(down, up) <= TAP.maxDistance
  );
}

/**
 * The finger is not compared here: on a touch screen every tap gets a fresh
 * `pointerId`, so requiring it would leave the double tap to the mouse only.
 */
export function isDoubleTap(previous: PointerMark | null, tap: PointerMark): boolean {
  if (!previous) return false;
  return (
    tap.time - previous.time <= DOUBLE_TAP.maxGap &&
    distance(previous, tap) <= DOUBLE_TAP.maxDistance
  );
}

/** What to do when a tap ends, and which tap the memory keeps. */
export type TapReading = {
  /** Is it time to give the card a half turn? */
  flip: boolean;
  /** Last completed tap, or `null` if the count starts over. */
  lastTap: PointerMark | null;
};

/**
 * Reads the gesture that has just ended on the card.
 *
 * `down` is optional because the same `pointerup` enters the handler several
 * times (once per mesh the ray passes through) and the component consumes
 * the mark when it reads it: the following deliveries arrive without it and
 * must not count. Whatever falls short of a tap (a drag) leaves the memory
 * as it was, and the second tap of a pair clears it so that a third tap
 * starts a new count instead of adding another half turn.
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
 * Share of a side that falls inside the view, from 0 (outside) to 1 (whole).
 * It is measured against the largest possible overlap (the shorter of the
 * two sides) so that a side longer than the screen does not count as
 * outside.
 */
function visibleShare(center: number, half: number, viewHalf: number): number {
  const span = Math.min(2 * half, 2 * viewHalf);
  if (span <= 0) return 1;

  const overlap = Math.min(center + half, viewHalf) - Math.max(center - half, -viewHalf);
  return Math.min(Math.max(overlap / span, 0), 1);
}

/**
 * Has the card left the view? Leaving along one axis is enough. It is
 * measured with the unrotated rectangle: while it spins it takes up less,
 * so the criterion errs on the cautious side and never fires too early.
 */
export function hasLeftView(card: CardBox, view: ViewBox): boolean {
  return (
    visibleShare(card.x, card.halfWidth, view.halfWidth) < MIN_VISIBLE_SHARE ||
    visibleShare(card.y, card.halfHeight, view.halfHeight) < MIN_VISIBLE_SHARE
  );
}
