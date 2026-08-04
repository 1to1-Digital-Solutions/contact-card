/**
 * Tokens de marca.
 *
 * ⚠️ PROVISIONAL: no disponemos todavía de los colores oficiales de
 * 1to1 Digital Solutions. Esta paleta es un marcador de posición sobrio
 * (tinta azulada + acento ámbar) pensada para sustituirse de una sola vez:
 * cambia los valores de aquí y de `@theme` en `app/globals.css` (mismos
 * nombres) y toda la app —tarjeta 3D incluida— queda actualizada.
 *
 * Los valores viven aquí en JS porque three.js no lee variables CSS.
 */
export const BRAND = {
  /** Fondo de la escena y de la página. */
  backdrop: "#0b1120",
  /** Cuerpo de la tarjeta (anverso). */
  cardFront: "#f7f5f0",
  /** Cuerpo de la tarjeta (reverso). */
  cardBack: "#111c33",
  /** Canto de la tarjeta. */
  cardEdge: "#e6e2d9",
  /** Texto principal sobre superficie clara. */
  ink: "#111c33",
  /** Texto secundario sobre superficie clara. */
  inkMuted: "#5b6478",
  /** Texto principal sobre superficie oscura. */
  inkInverse: "#f7f5f0",
  /** Texto secundario sobre superficie oscura. */
  inkInverseMuted: "#94a0ba",
  /** Acento de marca. */
  accent: "#d9a441",
  /** Acento oscurecido, para texto sobre superficie clara (el vivo no llega a AA). */
  accentInk: "#8a6318",
} as const;

/** Proporciones físicas de una tarjeta de visita estándar (85 × 55 mm). */
export const CARD = {
  width: 3.2,
  height: (3.2 * 55) / 85,
  thickness: 0.045,
  /** Radio de las esquinas, en las mismas unidades que el ancho. */
  radius: 0.09,
} as const;
