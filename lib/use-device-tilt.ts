"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { PointerTilt } from "./card-orientation";
import { screenAngles, stepDeviceTilt, type TiltState } from "./device-tilt";

const STILL: PointerTilt = { turn: 0, pitch: 0 };

/** How the screen is rotated relative to the device, in degrees. */
const screenAngle = (): number => window.screen?.orientation?.angle ?? 0;

/**
 * The peek the gyroscope asks for, to be read from the render loop.
 *
 * It goes in a ref and not in state because readings arrive sixty times a
 * second: each one would trigger a React render for something only the scene
 * looks at. When switched off it leaves the card facing front instead of
 * wherever it was.
 */
export function useDeviceTilt(enabled: boolean): RefObject<PointerTilt> {
  const tilt = useRef<PointerTilt>(STILL);

  useEffect(() => {
    tilt.current = STILL;
    if (!enabled || typeof DeviceOrientationEvent === "undefined") return;

    let state: TiltState = null;
    let angle = screenAngle();

    const onOrientation = (event: DeviceOrientationEvent) => {
      if (event.beta === null || event.gamma === null) return;
      // When the phone rotates, the screen axes swap places and the starting
      // posture no longer holds: it gets taken again.
      const current = screenAngle();
      if (current !== angle) {
        angle = current;
        state = null;
      }

      const step = stepDeviceTilt(state, {
        angles: screenAngles({ beta: event.beta, gamma: event.gamma }, angle),
        time: event.timeStamp,
      });
      state = step.state;
      tilt.current = step.tilt;
    };

    window.addEventListener("deviceorientation", onOrientation);
    return () => {
      window.removeEventListener("deviceorientation", onOrientation);
      tilt.current = STILL;
    };
  }, [enabled]);

  return tilt;
}
