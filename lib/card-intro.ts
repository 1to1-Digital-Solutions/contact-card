/**
 * La llegada de la tarjeta: cae desde fuera de la pantalla y, ya en el
 * centro, se balancea una vez para enseñar que se la puede mover.
 *
 * Son funciones puras del tiempo transcurrido —la animación vive en el bucle
 * de render, que ya lleva la cuenta— para poder probarlas sin montar la
 * escena 3D. Quién las llama decide cuándo dejan de contar: al primer gesto,
 * el vaivén se corta.
 */

/** Aire entre el borde de la vista y la tarjeta al empezar, en unidades de mundo. */
const ENTRY_GAP = 0.5;

/**
 * Altura de la que cae la tarjeta. Queda entera por encima del borde: la
 * caída tiene que verse venir de fuera, no aparecer a medias en el canto
 * superior de la pantalla.
 */
export function entryOffsetY(viewHalfHeight: number, cardHalfHeight: number): number {
  return viewHalfHeight + cardHalfHeight + ENTRY_GAP;
}

/** Postura del vaivén de bienvenida en un instante. */
export type IntroSway = {
  /**
   * Desplazamiento lateral, de -1 a 1. Es una fracción del recorrido y no una
   * medida: quien la usa la escala al tamaño que tenga la tarjeta en pantalla,
   * que en un móvil es menos de la mitad que en un escritorio.
   */
  x: number;
  /** Inclinación, en radianes: la tarjeta se retrasa hacia donde viene. */
  roll: number;
};

const SWAY = {
  /** Lo que tarda en arrancar: la tarjeta tiene que haber aterrizado antes. */
  delay: 0.85,
  /** Idas y vueltas completas. */
  cycles: 2,
  duration: 2.6,
  /** Tope de la inclinación: un balanceo de acompañamiento, no un vuelco. */
  maxRoll: 0.14,
} as const;

/** Segundos desde que aparece la tarjeta hasta que el vaivén termina. */
export const INTRO_SWAY_END = SWAY.delay + SWAY.duration;

const STILL: IntroSway = { x: 0, roll: 0 };

export function introSway(elapsed: number): IntroSway {
  const t = elapsed - SWAY.delay;
  if (t <= 0 || t >= SWAY.duration) return STILL;

  const phase = 2 * Math.PI * SWAY.cycles * (t / SWAY.duration);
  // Campana que entra y sale por cero. Sin ella el vaivén tendría que acabar
  // justo en un paso por el centro para no dar un tirón al soltarlo, y la
  // inclinación —que va un cuarto de oscilación por delante— nunca lo hace.
  const envelope = Math.sin((Math.PI * t) / SWAY.duration) ** 2;

  return {
    x: envelope * Math.sin(phase),
    roll: -SWAY.maxRoll * envelope * Math.cos(phase),
  };
}
