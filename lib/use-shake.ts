"use client";

import { useEffect, useRef } from "react";
import { STILL, stepShake } from "./shake";

/** Una lectura del acelerómetro, si el navegador la ha entregado entera. */
function accelerationOf(
  reading: DeviceMotionEventAcceleration | null,
): { x: number; y: number; z: number } | null {
  if (!reading || reading.x === null || reading.y === null || reading.z === null) {
    return null;
  }
  return { x: reading.x, y: reading.y, z: reading.z };
}

/**
 * Avisa cuando se agita el móvil.
 *
 * Se prefiere la aceleración sin la gravedad, que es la que mide el gesto de
 * verdad; donde no la hay se usa la otra, y el detector le quita la gravedad
 * por su cuenta. El aviso va en un ref para no volver a suscribirse al sensor
 * cada vez que quien escucha cambie de manejador.
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
