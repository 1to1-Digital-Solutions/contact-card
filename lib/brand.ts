/**
 * Tokens de marca de 1to1 Digital Solutions.
 *
 * Los valores salen de la paleta oficial: la escala verde
 * (primary-200 `#1ac89a`, primary-300 `#1f957a`, primary-500 `#116e57`) y los
 * neutros de los temas oscuro (`#27272a`, `#1e1e21`, `#ededed`) y claro
 * (`#f4f4f5`, `#1a1a1a`). La marca no define grises intermedios para texto
 * secundario ni para el canto del papel: esos tres se derivan de los neutros
 * oficiales y están fijados en el escalón que cumple WCAG AA (`brand.test.ts`
 * comprueba cada par de color y fondo).
 *
 * Los valores viven aquí en JS porque three.js no lee variables CSS; los
 * mismos nombres están duplicados en `@theme` de `app/globals.css` para
 * Tailwind, y hay que cambiar los dos a la vez.
 */
export const BRAND = {
  /** Fondo de la escena y de la página. */
  backdrop: "#27272a",
  /** Cuerpo de la tarjeta (anverso). */
  cardFront: "#f4f4f5",
  /** Cuerpo de la tarjeta (reverso). */
  cardBack: "#1e1e21",
  /** Canto de la tarjeta: el claro del anverso apagado, como el corte del papel. */
  cardEdge: "#e6e6e8",
  /** Texto principal sobre superficie clara. */
  ink: "#1a1a1a",
  /** Texto secundario sobre superficie clara: antracita aclarado hasta AA. */
  inkMuted: "#626265",
  /** Texto principal sobre superficie oscura. */
  inkInverse: "#ededed",
  /**
   * Texto secundario sobre superficie oscura: el claro apagado hasta AA. No
   * basta con que cumpla sobre `backdrop`: este texto también cae sobre el
   * fondo ya aclarado por las veladuras y el halo de `app/globals.css` (ahí
   * es donde se lee «Cargando la tarjeta…»), y ese es el caso que manda.
   */
  inkInverseMuted: "#b8b8bd",
  /** Acento de marca (primary-300). Para grafismos: como texto no llega a AA. */
  accent: "#1f957a",
  /** Acento para texto sobre superficie clara (primary-500). */
  accentInk: "#116e57",
  /** Acento para texto y foco sobre superficie oscura (primary-200). */
  accentInkInverse: "#1ac89a",
} as const;

/**
 * Logotipo oficial en negativo (trazo blanco), el que va sobre las superficies
 * oscuras. El fichero es el mismo que usa la web de la marca; las medidas son
 * las de su lienzo y sirven para escalarlo sin deformarlo (`brand.test.ts`
 * comprueba que siguen siendo las del SVG).
 */
export const LOGO = {
  src: "/logo-negative.svg",
  width: 246,
  height: 133,
} as const;

/** Proporciones físicas de una tarjeta de visita estándar (85 × 55 mm). */
export const CARD = {
  width: 3.2,
  height: (3.2 * 55) / 85,
  thickness: 0.045,
  /** Radio de las esquinas, en las mismas unidades que el ancho. */
  radius: 0.09,
} as const;
