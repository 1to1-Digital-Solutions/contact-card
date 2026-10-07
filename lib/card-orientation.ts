/**
 * Orientation of the card around its vertical axis.
 *
 * When released after a spin, the card snaps to the nearest half turn: it
 * always ends up showing a whole face, never the edge.
 */

import { clamp } from "./motion";

const HALF_TURN = Math.PI;

/** Nearest half turn to the given angle, in radians. */
export function snapToHalfTurn(angle: number): number {
  return Math.round(angle / HALF_TURN) * HALF_TURN;
}

/**
 * Does this angle leave the back facing the camera?
 *
 * It is resolved with the cosine instead of the division remainder because
 * `%` keeps the sign of the dividend and spins to the left yield negative
 * angles.
 */
export function isShowingBack(angleY: number): boolean {
  return Math.cos(angleY) < 0;
}

/**
 * How far the card peeks, in radians, at the far end of the gesture. It is
 * shared by the peek towards the pointer and the gyroscope one
 * (`device-tilt.ts`): they are the same gesture with two controls, and with
 * two different reaches they would read as two different animations when
 * moving from the mouse to the phone.
 */
export const TILT_REACH = { turn: 0.22, pitch: 0.14 } as const;

/** What the pointer adds to the card's orientation, in radians. */
export type PointerTilt = {
  /** Turn around the vertical axis. */
  turn: number;
  /** Pitch around the horizontal axis. */
  pitch: number;
};

/**
 * Tilt of the card according to where the pointer is, with the mouse away
 * from it. The coordinates arrive normalised from -1 (left, bottom) to 1
 * (right, top), as the scene provides them, and are clamped because the
 * pointer can leave the canvas without releasing the capture.
 *
 * The side the pointer passes over is the one that sinks, as if it were
 * pushing it: a positive turn around the vertical axis moves the right edge
 * away, and a positive one around the horizontal axis brings the top edge
 * closer. It is the same mapping the spin-by-dragging-the-background gesture
 * already has.
 */
export function pointerTilt(pointerX: number, pointerY: number): PointerTilt {
  return {
    turn: clamp(pointerX, -1, 1) * TILT_REACH.turn,
    pitch: -clamp(pointerY, -1, 1) * TILT_REACH.pitch,
  };
}
