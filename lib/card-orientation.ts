/**
 * Orientación de la tarjeta alrededor de su eje vertical.
 *
 * Al soltarla tras girarla, la tarjeta encaja en la media vuelta más
 * cercana: siempre acaba enseñando una cara entera, nunca el canto.
 */

import { clamp } from "./motion";

const HALF_TURN = Math.PI;

/** Media vuelta más cercana al ángulo dado, en radianes. */
export function snapToHalfTurn(angle: number): number {
  return Math.round(angle / HALF_TURN) * HALF_TURN;
}

/**
 * ¿Este ángulo deja el reverso hacia la cámara?
 *
 * Se resuelve con el coseno en lugar de con el resto de la división porque
 * `%` conserva el signo del dividendo y los giros hacia la izquierda dan
 * ángulos negativos.
 */
export function isShowingBack(angleY: number): boolean {
  return Math.cos(angleY) < 0;
}

/** Cuánto se asoma la tarjeta hacia el puntero, en radianes. */
const TO_POINTER = { turn: 0.22, pitch: 0.14 } as const;

/** Lo que el puntero le suma a la orientación de la tarjeta, en radianes. */
export type PointerTilt = {
  /** Giro alrededor del eje vertical. */
  turn: number;
  /** Cabeceo alrededor del eje horizontal. */
  pitch: number;
};

/**
 * Inclinación de la tarjeta según por dónde ande el puntero, con el ratón
 * lejos de ella. Las coordenadas llegan normalizadas de -1 (izquierda, abajo)
 * a 1 (derecha, arriba), como las da la escena, y se recortan porque el
 * puntero puede salirse del lienzo sin soltar la captura.
 *
 * El lado por el que pasa el puntero es el que se hunde, igual que si lo
 * empujara: un giro positivo alrededor del eje vertical aleja el borde
 * derecho, y uno positivo alrededor del horizontal acerca el superior. Es la
 * misma correspondencia que ya tiene el gesto de girar arrastrando el fondo.
 */
export function pointerTilt(pointerX: number, pointerY: number): PointerTilt {
  return {
    turn: clamp(pointerX, -1, 1) * TO_POINTER.turn,
    pitch: -clamp(pointerY, -1, 1) * TO_POINTER.pitch,
  };
}
