/**
 * Shaking the phone to flip the card over.
 *
 * It is a pure state machine over accelerometer readings —each with its
 * timestamp— so it can be tested with fake shakes that a walk does not flip
 * the card and a real shake does. The caller only listens to the sensor and
 * passes along what arrives.
 */

import { smoothTowards, type SmoothConfig } from "./motion";

/** One accelerometer reading, in m/s², with its instant in milliseconds. */
export type ShakeSample = {
  x: number;
  y: number;
  z: number;
  time: number;
};

/**
 * How quickly the direction gravity pulls in is forgotten. It is a high-pass
 * filter: what changes slowly —gravity, turning the phone in the hand— goes
 * away with the average and only the jolt remains. It is needed because not
 * every browser delivers the acceleration with gravity already subtracted.
 */
const GRAVITY: SmoothConfig = { halfLife: 0.35, rest: 0 };

const SHAKE = {
  /**
   * Jolt that counts as a hit, in m/s². It is a high value on purpose: below
   * it, walking with the phone in hand would end up flipping the card.
   */
  jolt: 12,
  /** Hits that make a shake: a single one is a stumble, not an intention. */
  jolts: 3,
  /**
   * Minimum time between hits, in milliseconds. A single jolt lasts several
   * sensor readings, and without this it would count as a whole shake.
   */
  gap: 90,
  /** Window the hits have to fit in, in milliseconds. */
  window: 900,
  /**
   * Rest after accepting a shake. Shaking lasts longer than the shake that
   * gets recognised, and without this the card would keep flipping for as
   * long as the gesture lasts instead of the half turn that was asked for.
   */
  cooldown: 1000,
};

/**
 * What has to be remembered between readings: where gravity pulls, the hits
 * counted so far and until when the rest lasts.
 */
export type ShakeState = {
  gravity: { x: number; y: number; z: number };
  /** Instant of the last reading, or -1 while none has arrived. */
  time: number;
  jolts: number;
  /** Instant of the first hit of the streak and of the last one counted. */
  first: number;
  last: number;
  /** From when hits are counted again. */
  ready: number;
};

/** The phone still and nothing counted: this is where it starts. */
export const STILL: ShakeState = {
  gravity: { x: 0, y: 0, z: 0 },
  time: -1,
  jolts: 0,
  first: 0,
  last: 0,
  ready: 0,
};

/**
 * Gap between readings, in seconds, that is no longer good for filtering
 * anything: the tab was asleep or the sensor has reattached. It starts over
 * instead of measuring a jolt that never happened.
 */
const MAX_GAP = 1;

/** One sensor reading: what remains of the state and whether this was a shake. */
export function stepShake(
  state: ShakeState,
  sample: ShakeSample,
): { state: ShakeState; shaken: boolean } {
  const dt = (sample.time - state.time) / 1000;

  // The first reading only serves to learn where the ground is: measuring a
  // jolt against a gravity that is still zero would yield a shake on opening
  // the page.
  if (state.time < 0 || dt <= 0 || dt > MAX_GAP) {
    return {
      state: {
        ...STILL,
        gravity: { x: sample.x, y: sample.y, z: sample.z },
        time: sample.time,
        ready: state.ready,
      },
      shaken: false,
    };
  }

  const gravity = {
    x: smoothTowards(state.gravity.x, sample.x, GRAVITY, dt),
    y: smoothTowards(state.gravity.y, sample.y, GRAVITY, dt),
    z: smoothTowards(state.gravity.z, sample.z, GRAVITY, dt),
  };
  const jolt = Math.hypot(sample.x - gravity.x, sample.y - gravity.y, sample.z - gravity.z);

  const next: ShakeState = { ...state, gravity, time: sample.time };
  // The streak expires: a few loose, spaced-out hits are not a shake.
  if (sample.time - state.first > SHAKE.window) next.jolts = 0;

  const counts =
    sample.time >= state.ready &&
    jolt >= SHAKE.jolt &&
    sample.time - state.last >= SHAKE.gap;
  if (!counts) return { state: next, shaken: false };

  next.last = sample.time;
  next.jolts += 1;
  if (next.jolts === 1) next.first = sample.time;
  if (next.jolts < SHAKE.jolts) return { state: next, shaken: false };

  return {
    state: { ...next, jolts: 0, first: 0, ready: sample.time + SHAKE.cooldown },
    shaken: true,
  };
}
