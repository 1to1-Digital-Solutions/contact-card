"use client";

import { useCallback, useState, useSyncExternalStore } from "react";

/**
 * Si se pueden usar los sensores de movimiento del móvil.
 *
 * - `unavailable`: no hay sensores, o se ha dicho que no.
 * - `prompt`: los hay, pero el navegador pide permiso y solo lo concede desde
 *   un gesto: hace falta un botón que lo pida (es el caso de iOS).
 * - `granted`: se pueden escuchar.
 */
export type MotionAccess = "unavailable" | "prompt" | "granted";

/** El permiso que pide iOS, que no está en los tipos del DOM. */
type Gated = { requestPermission?: () => Promise<"granted" | "denied" | "default"> };

const gates = (): Gated[] =>
  [
    typeof DeviceMotionEvent === "undefined" ? null : (DeviceMotionEvent as Gated),
    typeof DeviceOrientationEvent === "undefined"
      ? null
      : (DeviceOrientationEvent as Gated),
  ].filter((gate) => gate !== null);

const needsPermission = (): boolean =>
  gates().some((gate) => typeof gate.requestPermission === "function");

/** Qué ofrece este navegador. No cambia mientras la página esté abierta. */
function environment(): MotionAccess {
  if (gates().length === 0) return "unavailable";
  return needsPermission() ? "prompt" : "granted";
}

/** No hay a qué suscribirse: lo que hay es lo que había al abrir la página. */
const subscribe = () => () => {};

/** En el servidor no hay sensores: así el primer render coincide con el suyo. */
const onServer = (): MotionAccess => "unavailable";

/**
 * Estado del permiso y la forma de pedirlo. La petición tiene que salir del
 * `onClick` de un botón: iOS descarta la que llega sin gesto detrás, y encima
 * se queda con el «no» hasta que se recargue la página.
 */
export function useMotionAccess(): { access: MotionAccess; request: () => void } {
  const available = useSyncExternalStore(subscribe, environment, onServer);
  // La respuesta al diálogo del sistema, mientras no la haya manda el entorno.
  const [answer, setAnswer] = useState<MotionAccess | null>(null);

  const request = useCallback(() => {
    void (async () => {
      const answers = await Promise.all(
        gates().map(async (gate) => {
          if (typeof gate.requestPermission !== "function") return "granted";
          try {
            return await gate.requestPermission();
          } catch (error) {
            // El registro es para diagnosticar, no para leer: va sin traducir.
            console.warn("No se ha podido pedir el permiso de movimiento:", error);
            return "denied";
          }
        }),
      );
      // Un «no» a cualquiera de los dos deja el botón sin nada que ofrecer:
      // volver a pedirlo no abre otro diálogo, así que se retira.
      setAnswer(answers.every((given) => given === "granted") ? "granted" : "unavailable");
    })();
  }, []);

  return { access: answer ?? available, request };
}
