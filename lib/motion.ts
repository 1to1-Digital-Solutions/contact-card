/**
 * Muelles amortiguados para la animación de la tarjeta.
 *
 * Se integran a mano (Euler semi-implícito) en lugar de tirar de una
 * librería de animación porque la tarjeta se anima dentro del bucle de
 * render de three.js, donde ya recibimos el delta de cada frame.
 */

export type SpringState = {
  value: number;
  velocity: number;
};

export type SpringConfig = {
  /** Cuánto tira hacia el objetivo. Más alto = más rápido y más rígido. */
  stiffness: number;
  /** Cuánto frena. Más alto = menos rebote. */
  damping: number;
  /** Inercia. Por defecto 1. */
  mass?: number;
};

/**
 * Paso máximo de integración. Un frame perdido (pestaña en segundo plano,
 * GC) puede traer un delta enorme; sin subdividir, el integrador explota
 * y la tarjeta sale disparada.
 */
const MAX_STEP = 1 / 120;

export function stepSpring(
  state: SpringState,
  target: number,
  config: SpringConfig,
  dt: number,
): SpringState {
  if (dt <= 0) return state;

  const mass = config.mass ?? 1;
  const substeps = Math.min(Math.ceil(dt / MAX_STEP), 240);
  const h = dt / substeps;

  let { value, velocity } = state;
  for (let i = 0; i < substeps; i++) {
    const acceleration =
      (-config.stiffness * (value - target) - config.damping * velocity) / mass;
    velocity += acceleration * h;
    value += velocity * h;
  }

  return { value, velocity };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
