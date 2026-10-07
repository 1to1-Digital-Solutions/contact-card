/**
 * The card's peek when the phone moves, which is what the mouse does on a
 * desktop (`pointerTilt`, in `card-orientation.ts`).
 *
 * The card behaves as if it were still in the world and it were the window
 * that moved: when the phone tilts, the card turns by the same amount in the
 * opposite direction, which is why it looks like a real object behind the
 * glass.
 *
 * Everything is a pure function over the angles `deviceorientation`
 * delivers, in degrees, so the peek can be tested without a sensor and
 * without a scene.
 */

import { TILT_REACH, type PointerTilt } from "./card-orientation";
import { clamp, smoothTowards, type SmoothConfig } from "./motion";

/** The two sensor angles that move the card, in degrees. */
export type DeviceAngles = {
  /** Pitch: raising or lowering the top edge. */
  beta: number;
  /** Roll: tilting to the right or to the left. */
  gamma: number;
};

/**
 * Degrees of deviation that reach the maximum peek. It is a wrist gesture:
 * with more travel, the card would barely move while looking at the phone
 * the way one normally does, and with less it would hit the cap at the first
 * tremor.
 */
const SPAN = 22;

/**
 * How quickly the starting pose is forgotten. Holding the phone tilted is
 * the norm (on the sofa, in bed), and without this forgetting the card would
 * stay crooked forever because of the viewer's posture. It is slow on
 * purpose: for the length of a glance, the peek is still there.
 */
const REFERENCE: SmoothConfig = { halfLife: 2, rest: 0 };

/**
 * The sensor angles belong to the device, not to what is seen: when the
 * phone rotates, the screen repositions itself and its axes no longer match
 * the device's. This brings them to the screen's axes, which are the ones
 * the card moves in, by rotating them through the same angle as the browser
 * (`screenAngle`, from `screen.orientation`).
 */
export function screenAngles(angles: DeviceAngles, screenAngle: number): DeviceAngles {
  const turn = (screenAngle * Math.PI) / 180;
  const cos = Math.cos(turn);
  const sin = Math.sin(turn);
  return {
    beta: angles.beta * cos - angles.gamma * sin,
    gamma: angles.beta * sin + angles.gamma * cos,
  };
}

/** The pose the peek is measured from, and when it was taken. */
export type TiltState = {
  reference: DeviceAngles;
  /** Instant of the last reading, in milliseconds. */
  time: number;
} | null;

/**
 * Gap between readings, in seconds, beyond which the starting pose is no
 * longer valid: the tab was asleep and the phone is wherever it is.
 */
const MAX_GAP = 1;

/**
 * Difference between two angles along the short way round, in degrees. The
 * pitch goes a full circle and jumps from 180 to -180 when the phone passes
 * through vertical: subtracting naively would turn that jump into the card
 * flipping over.
 */
function angleGap(angle: number, reference: number): number {
  return ((angle - reference + 540) % 360) - 180;
}

/**
 * One sensor reading: how far the card peeks and which pose it is being
 * measured from. The first reading moves nothing (it fixes the starting
 * pose), so it does not matter how the phone is held when the page opens.
 */
export function stepDeviceTilt(
  state: TiltState,
  reading: { angles: DeviceAngles; time: number },
): { state: TiltState; tilt: PointerTilt } {
  const dt = state ? (reading.time - state.time) / 1000 : 0;
  if (!state || dt < 0 || dt > MAX_GAP) {
    return {
      state: { reference: reading.angles, time: reading.time },
      tilt: { turn: 0, pitch: 0 },
    };
  }

  // The deviation is measured against the starting pose while at the same
  // time dragging that pose towards the current one: what is held stops
  // counting, and what has just moved counts in full.
  const offset = {
    beta: smoothTowards(angleGap(reading.angles.beta, state.reference.beta), 0, REFERENCE, dt),
    gamma: smoothTowards(angleGap(reading.angles.gamma, state.reference.gamma), 0, REFERENCE, dt),
  };

  return {
    state: {
      reference: {
        beta: reading.angles.beta - offset.beta,
        gamma: reading.angles.gamma - offset.gamma,
      },
      time: reading.time,
    },
    // The opposite of the phone: if it tilts to the right, the card turns to
    // the left and keeps facing where it was facing.
    tilt: {
      turn: -clamp(offset.gamma / SPAN, -1, 1) * TILT_REACH.turn,
      pitch: -clamp(offset.beta / SPAN, -1, 1) * TILT_REACH.pitch,
    },
  };
}
