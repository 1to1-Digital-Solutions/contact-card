/**
 * Orientación de la tarjeta alrededor de su eje vertical.
 *
 * Al soltarla tras girarla, la tarjeta encaja en la media vuelta más
 * cercana: siempre acaba enseñando una cara entera, nunca el canto.
 */

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
