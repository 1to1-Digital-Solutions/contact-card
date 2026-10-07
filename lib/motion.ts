/**
 * Damped springs for the card animation.
 *
 * They are integrated by hand (semi-implicit Euler) instead of pulling in an
 * animation library because the card animates inside the three.js render
 * loop, where we already receive each frame's delta.
 */

export type SpringState = {
  value: number;
  velocity: number;
};

export type SpringConfig = {
  /** How hard it pulls towards the target. Higher = faster and stiffer. */
  stiffness: number;
  /** How much it brakes. Higher = less bounce. */
  damping: number;
  /** Inertia. Defaults to 1. */
  mass?: number;
};

/**
 * Maximum integration step. A dropped frame (background tab, GC) can bring a
 * huge delta; without subdividing, the integrator blows up and the card shoots
 * off.
 */
const MAX_STEP = 1 / 120;

export function stepSpring(
  state: SpringState,
  target: number,
  config: SpringConfig,
  dt: number,
): SpringState {
  if (dt <= 0) return state;

  const mass = config.mass ?? 1;
  const substeps = Math.min(Math.ceil(dt / MAX_STEP), 240);
  const h = dt / substeps;

  let { value, velocity } = state;
  for (let i = 0; i < substeps; i++) {
    const acceleration =
      (-config.stiffness * (value - target) - config.damping * velocity) / mass;
    velocity += acceleration * h;
    value += velocity * h;
  }

  return { value, velocity };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * First-order smoothing, to filter a signal that arrives in jumps —the
 * pointer— before a spring chases it.
 *
 * Unlike the spring it has no inertia: it neither overshoots the target nor
 * bounces, it just arrives later. That is why it works for smoothing the
 * *input* of the gesture without changing where it goes.
 */
export type SmoothConfig = {
  /** Seconds to cover half of what is left. 0 lets the signal through as is. */
  halfLife: number;
  /**
   * Distance below which it snaps to the target. Without it the filter keeps
   * approaching forever without arriving, and whatever was moving keeps moving
   * —less and less— long after the pointer has stopped.
   */
  rest: number;
};

export function smoothTowards(
  current: number,
  target: number,
  config: SmoothConfig,
  dt: number,
): number {
  if (dt <= 0) return current;
  if (config.halfLife <= 0) return target;

  // Exact solution of the exponential decay, not a fixed fraction per frame:
  // that way the distance covered depends on the elapsed time and not on how
  // many times it was called, and a dropped frame neither speeds up nor slows
  // down the filter.
  const remaining = (current - target) * 2 ** (-dt / config.halfLife);
  return Math.abs(remaining) <= config.rest ? target : target + remaining;
}
