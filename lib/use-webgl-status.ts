import { useSyncExternalStore } from "react";

/**
 * `pending` mientras el HTML del servidor aún no se ha hidratado; después,
 * si el navegador puede pintar en 3D o no.
 */
export type WebGLStatus = "pending" | "ready" | "unsupported";

let cached: WebGLStatus | null = null;

/**
 * Si el navegador no puede con WebGL —deshabilitado, driver bloqueado,
 * navegador antiguo— no es un error que reportar: la página enseña la
 * versión plana de la tarjeta, con exactamente los mismos datos.
 */
function detect(): WebGLStatus {
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    return context ? "ready" : "unsupported";
  } catch {
    return "unsupported";
  }
}

function getSnapshot(): WebGLStatus {
  cached ??= detect();
  return cached;
}

function getServerSnapshot(): WebGLStatus {
  return "pending";
}

/** La capacidad no cambia durante la vida de la página: no hay a qué suscribirse. */
const subscribe = () => () => {};

export function useWebGLStatus(): WebGLStatus {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
