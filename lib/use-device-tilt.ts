"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { PointerTilt } from "./card-orientation";
import { screenAngles, stepDeviceTilt, type TiltState } from "./device-tilt";

const STILL: PointerTilt = { turn: 0, pitch: 0 };

/** Cómo está girada la pantalla respecto del aparato, en grados. */
const screenAngle = (): number => window.screen?.orientation?.angle ?? 0;

/**
 * El asomo que pide el giroscopio, para leerlo desde el bucle de render.
 *
 * Va en un ref y no en el estado porque las lecturas llegan a sesenta por
 * segundo: cada una provocaría un render de React para algo que solo mira la
 * escena. Al apagarse deja la tarjeta de frente en vez de donde estuviera.
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
      // Al girar el móvil, los ejes de la pantalla cambian de sitio y la
      // postura de partida deja de valer: se vuelve a tomar.
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
