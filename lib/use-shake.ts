"use client";

import { useEffect, useRef } from "react";
import { STILL, stepShake } from "./shake";

/** One accelerometer reading, if the browser delivered it whole. */
function accelerationOf(
  reading: DeviceMotionEventAcceleration | null,
): { x: number; y: number; z: number } | null {
  if (!reading || reading.x === null || reading.y === null || reading.z === null) {
    return null;
  }
  return { x: reading.x, y: reading.y, z: reading.z };
}

/**
 * Notifies when the phone is shaken.
 *
 * The acceleration without gravity is preferred, which is the one that really
 * measures the gesture; where it is not available the other one is used, and
 * the detector removes gravity on its own. The callback goes in a ref so as
 * not to resubscribe to the sensor every time the listener changes handler.
 */
export function useShake(enabled: boolean, onShake: () => void): void {
  const shaken = useRef(onShake);

  useEffect(() => {
    shaken.current = onShake;
  }, [onShake]);

  useEffect(() => {
    if (!enabled || typeof DeviceMotionEvent === "undefined") return;

    let state = STILL;
    const onMotion = (event: DeviceMotionEvent) => {
      const reading =
        accelerationOf(event.acceleration) ??
        accelerationOf(event.accelerationIncludingGravity);
      if (!reading) return;

      const step = stepShake(state, { ...reading, time: event.timeStamp });
      state = step.state;
      if (step.shaken) shaken.current();
    };

    window.addEventListener("devicemotion", onMotion);
    return () => window.removeEventListener("devicemotion", onMotion);
  }, [enabled]);
}
