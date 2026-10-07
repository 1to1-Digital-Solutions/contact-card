/**
 * The card's arrival: it falls in from off screen and, once in the centre,
 * sways once to show that it can be moved.
 *
 * They are pure functions of the elapsed time (the animation lives in the
 * render loop, which already keeps count) so they can be tested without
 * mounting the 3D scene. The caller decides when they stop counting: at the
 * first gesture, the sway is cut short.
 */

/** Air between the edge of the view and the card at the start, in world units. */
const ENTRY_GAP = 0.5;

/**
 * Height the card falls from. It sits entirely above the edge: the fall has
 * to be seen coming from outside, not appear half-way through at the top
 * edge of the screen.
 */
export function entryOffsetY(viewHalfHeight: number, cardHalfHeight: number): number {
  return viewHalfHeight + cardHalfHeight + ENTRY_GAP;
}

/** Pose of the welcome sway at a given instant. */
export type IntroSway = {
  /**
   * Lateral displacement, from -1 to 1. It is a fraction of the travel, not
   * a measurement: the consumer scales it to whatever size the card has on
   * screen, which on a phone is less than half of what it is on a desktop.
   */
  x: number;
  /** Tilt, in radians: the card lags towards where it is coming from. */
  roll: number;
};

const SWAY = {
  /** How long it takes to start: the card has to have landed first. */
  delay: 0.85,
  /** Complete round trips. */
  cycles: 2,
  duration: 2.6,
  /** Cap on the tilt: an accompanying sway, not a tip-over. */
  maxRoll: 0.14,
} as const;

/** Seconds from when the card appears until the sway ends. */
export const INTRO_SWAY_END = SWAY.delay + SWAY.duration;

const STILL: IntroSway = { x: 0, roll: 0 };

export function introSway(elapsed: number): IntroSway {
  const t = elapsed - SWAY.delay;
  if (t <= 0 || t >= SWAY.duration) return STILL;

  const phase = 2 * Math.PI * SWAY.cycles * (t / SWAY.duration);
  // A bell that enters and leaves through zero. Without it the sway would
  // have to end exactly on a pass through the centre to avoid a jolt when
  // released, and the tilt (which runs a quarter of an oscillation ahead)
  // never does.
  const envelope = Math.sin((Math.PI * t) / SWAY.duration) ** 2;

  return {
    x: envelope * Math.sin(phase),
    roll: -SWAY.maxRoll * envelope * Math.cos(phase),
  };
}
