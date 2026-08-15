/**
 * Agitar el móvil para dar la vuelta a la tarjeta.
 *
 * Es una máquina de estados pura sobre lecturas del acelerómetro —cada una con
 * su marca de tiempo— para poder probar con sacudidas de mentira que un paseo
 * no da vueltas a la tarjeta y que una sacudida de verdad sí. Quien la llama
 * solo escucha el sensor y le pasa lo que llega.
 */

import { smoothTowards, type SmoothConfig } from "./motion";

/** Una lectura del acelerómetro, en m/s², con su instante en milisegundos. */
export type ShakeSample = {
  x: number;
  y: number;
  z: number;
  time: number;
};

/**
 * Con qué rapidez se olvida hacia dónde tira la gravedad. Es un filtro de paso
 * alto: lo que cambia despacio —la gravedad, girar el móvil en la mano— se va
 * con la media y solo queda el tirón. Hace falta porque no todos los
 * navegadores entregan la aceleración con la gravedad ya descontada.
 */
const GRAVITY: SmoothConfig = { halfLife: 0.35, rest: 0 };

const SHAKE = {
  /**
   * Tirón que cuenta como golpe, en m/s². Es un valor alto a propósito: por
   * debajo, andar con el móvil en la mano acabaría volteando la tarjeta.
   */
  jolt: 12,
  /** Golpes que hacen una sacudida: uno solo es un tropiezo, no una intención. */
  jolts: 3,
  /**
   * Tiempo mínimo entre golpes, en milisegundos. Un mismo tirón dura varias
   * lecturas del sensor, y sin esto contaría como una sacudida entera.
   */
  gap: 90,
  /** Ventana en la que tienen que caber los golpes, en milisegundos. */
  window: 900,
  /**
   * Reposo tras dar por buena una sacudida. Agitar dura más que la sacudida
   * que se reconoce, y sin esto la tarjeta daría vueltas mientras dure el
   * gesto en vez de la media vuelta que se ha pedido.
   */
  cooldown: 1000,
};

/**
 * Lo que hay que recordar entre lecturas: hacia dónde tira la gravedad, los
 * golpes que llevamos y hasta cuándo dura el reposo.
 */
export type ShakeState = {
  gravity: { x: number; y: number; z: number };
  /** Instante de la última lectura, o -1 mientras no haya llegado ninguna. */
  time: number;
  jolts: number;
  /** Instante del primer golpe de la racha y del último contado. */
  first: number;
  last: number;
  /** A partir de cuándo se vuelven a contar golpes. */
  ready: number;
};

/** El móvil quieto y sin nada contado: por aquí se empieza. */
export const STILL: ShakeState = {
  gravity: { x: 0, y: 0, z: 0 },
  time: -1,
  jolts: 0,
  first: 0,
  last: 0,
  ready: 0,
};

/**
 * Salto entre lecturas, en segundos, que ya no vale para filtrar nada: la
 * pestaña estuvo dormida o el sensor se ha reenganchado. Se vuelve a empezar
 * en vez de medir un tirón que no ha existido.
 */
const MAX_GAP = 1;

/** Una lectura del sensor: qué queda del estado y si esto ha sido una sacudida. */
export function stepShake(
  state: ShakeState,
  sample: ShakeSample,
): { state: ShakeState; shaken: boolean } {
  const dt = (sample.time - state.time) / 1000;

  // La primera lectura solo sirve para saber dónde está el suelo: medir un
  // tirón contra una gravedad que todavía vale cero daría una sacudida al
  // abrir la página.
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
  // La racha caduca: unos golpes sueltos y espaciados no son una sacudida.
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
