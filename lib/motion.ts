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

/**
 * Amortiguación de primer orden, para filtrar una señal que llega a saltos
 * —el puntero— antes de que la persiga un muelle.
 *
 * A diferencia del muelle no tiene inercia: no sobrepasa el objetivo ni
 * rebota, solo llega más tarde. Por eso vale para suavizar la *entrada* del
 * gesto sin cambiar a dónde va.
 */
export type SmoothConfig = {
  /** Segundos en recorrer la mitad de lo que falta. 0 deja pasar la señal tal cual. */
  halfLife: number;
  /**
   * Distancia por debajo de la cual se planta en el objetivo. Sin ella el
   * filtro se acerca eternamente sin llegar, y lo que se movía sigue moviéndose
   * —cada vez menos— mucho después de que el puntero se haya parado.
   */
  rest: number;
};

export function smoothTowards(
  current: number,
  target: number,
  config: SmoothConfig,
  dt: number,
): number {
  if (dt <= 0) return current;
  if (config.halfLife <= 0) return target;

  // Solución exacta de la caída exponencial, no una fracción fija por frame:
  // así el recorrido depende del tiempo transcurrido y no de cuántas veces se
  // haya llamado, y un frame perdido no acelera ni frena el filtro.
  const remaining = (current - target) * 2 ** (-dt / config.halfLife);
  return Math.abs(remaining) <= config.rest ? target : target + remaining;
}
