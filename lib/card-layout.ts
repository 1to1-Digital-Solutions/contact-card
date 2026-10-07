/**
 * How big the card is in the space available.
 *
 * It is a pure function of two measurements (the visible space and the
 * card, both in world units) so that, without mounting the scene, we can
 * check that the card fits on every screen and makes the most of the one it
 * has. The scene only decides which of the three spaces it is in.
 */

import { clamp } from "./motion";

/** Width and height, in world units. */
export type Size = {
  width: number;
  height: number;
};

/**
 * Share of the visible width and height the card takes up at rest.
 *
 * In a space taller than it is wide (a phone held upright) width is the
 * scarce resource and there is height to spare: there the card stretches
 * almost edge to edge so it does not lose prominence. On a phone held
 * sideways the opposite happens, and nothing else fits on screen either:
 * the card takes almost the full height and the controls sit on top of it,
 * floating, instead of stealing its room.
 */
const SHARE = {
  landscape: { width: 0.62, height: 0.55 },
  portrait: { width: 0.9, height: 0.6 },
  phoneLandscape: { width: 0.86, height: 0.82 },
} as const;

/**
 * Bounds on the scale. The minimum keeps the card from shrinking to a stamp
 * in a tiny window; the maximum is a safety net for an almost square space,
 * where the width-based share shoots up. On everyday screens `SHARE` is in
 * charge.
 */
const SCALE = { min: 0.25, max: 1.3 } as const;

/**
 * How much to scale the card so it takes up its share of the space.
 *
 * @param phoneLandscape Phone held sideways (the `PHONE_LANDSCAPE` query):
 *   the whole screen belongs to the card.
 */
export function cardScale(view: Size, card: Size, phoneLandscape: boolean): number {
  const share = phoneLandscape
    ? SHARE.phoneLandscape
    : view.height > view.width
      ? SHARE.portrait
      : SHARE.landscape;

  return clamp(
    Math.min(
      (view.width * share.width) / card.width,
      (view.height * share.height) / card.height,
    ),
    SCALE.min,
    SCALE.max,
  );
}
