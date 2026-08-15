/**
 * El asomo de la tarjeta cuando se mueve el móvil, que es lo que en un
 * escritorio hace el ratón (`pointerTilt`, en `card-orientation.ts`).
 *
 * La tarjeta se comporta como si estuviera quieta en el mundo y quien se
 * moviera fuese la ventana: al inclinar el móvil, ella gira lo mismo en
 * sentido contrario y por eso parece un objeto de verdad detrás del cristal.
 *
 * Todo son funciones puras sobre los ángulos que entrega `deviceorientation`,
 * en grados, para poder probar el asomo sin sensor y sin escena.
 */

import { TILT_REACH, type PointerTilt } from "./card-orientation";
import { clamp, smoothTowards, type SmoothConfig } from "./motion";

/** Los dos ángulos del sensor que mueven la tarjeta, en grados. */
export type DeviceAngles = {
  /** Cabeceo: levantar o bajar el borde de arriba. */
  beta: number;
  /** Alabeo: inclinar hacia la derecha o hacia la izquierda. */
  gamma: number;
};

/**
 * Grados de desvío que llevan al asomo máximo. Es un gesto de muñeca: con más
 * recorrido, la tarjeta apenas se movería mirando el móvil como se mira
 * normalmente, y con menos se iría al tope al primer temblor.
 */
const SPAN = 22;

/**
 * Con qué rapidez se olvida la postura de partida. Sostener el móvil inclinado
 * es lo normal —en el sofá, en la cama—, y sin este olvido la tarjeta se
 * quedaría torcida para siempre por la postura de quien mira. Es lento a
 * propósito: en el tiempo de un vistazo, el asomo sigue ahí.
 */
const REFERENCE: SmoothConfig = { halfLife: 2, rest: 0 };

/**
 * Los ángulos del sensor son del aparato y no de lo que se ve: al girar el
 * móvil, la pantalla se recoloca y sus ejes dejan de coincidir con los de
 * aquel. Esto los lleva a los ejes de la pantalla, que son en los que se mueve
 * la tarjeta, girándolos por el mismo ángulo que el navegador (`screenAngle`,
 * de `screen.orientation`).
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

/** La postura de la que se mide el asomo, y cuándo se tomó. */
export type TiltState = {
  reference: DeviceAngles;
  /** Instante de la última lectura, en milisegundos. */
  time: number;
} | null;

/**
 * Salto entre lecturas, en segundos, tras el que la postura de partida ya no
 * vale: la pestaña estuvo dormida y el móvil está donde esté.
 */
const MAX_GAP = 1;

/**
 * Diferencia entre dos ángulos por el camino corto, en grados. El cabeceo da
 * la vuelta entera y salta de 180 a -180 al pasar el móvil por la vertical:
 * restar sin más convertiría ese salto en un vuelco de la tarjeta.
 */
function angleGap(angle: number, reference: number): number {
  return ((angle - reference + 540) % 360) - 180;
}

/**
 * Una lectura del sensor: cuánto se asoma la tarjeta y de qué postura se está
 * midiendo. La primera lectura no mueve nada —fija la postura de partida—, así
 * que da igual cómo se sostenga el móvil al abrir la página.
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

  // El desvío se mide contra la postura de partida y a la vez la va arrastrando
  // hacia la de ahora: lo que se sostiene deja de contar, y lo que se acaba de
  // mover cuenta entero.
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
    // Al revés que el móvil: si se inclina hacia la derecha, la tarjeta gira
    // hacia la izquierda y se queda mirando a donde miraba.
    tilt: {
      turn: -clamp(offset.gamma / SPAN, -1, 1) * TILT_REACH.turn,
      pitch: -clamp(offset.beta / SPAN, -1, 1) * TILT_REACH.pitch,
    },
  };
}
