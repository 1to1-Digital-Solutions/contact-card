import { describe, expect, it } from "vitest";
import { BRAND } from "./brand";

/**
 * Los tokens de marca solo valen si el texto se lee encima de su fondo. Aquí
 * está fijada cada combinación que existe en la tarjeta y en la página, con el
 * umbral que le toca: 4.5:1 para texto (WCAG 2.2, criterio 1.4.3 AA) y 3:1
 * para lo que es solo forma (1.4.11).
 */

/** Canal sRGB a luz lineal, según la definición de luminancia relativa de WCAG. */
function toLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const value = Number.parseInt(hex.slice(1), 16);
  return (
    0.2126 * toLinear((value >> 16) & 255) +
    0.7152 * toLinear((value >> 8) & 255) +
    0.0722 * toLinear(value & 255)
  );
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

/** Pares de texto sobre fondo, con dónde aparece cada uno. */
const TEXT: Array<[string, string, string]> = [
  [BRAND.ink, BRAND.cardFront, "nombre y datos del anverso"],
  [BRAND.inkMuted, BRAND.cardFront, "etiquetas del anverso"],
  [BRAND.accentInk, BRAND.cardFront, "empresa en el anverso"],
  [BRAND.inkInverse, BRAND.cardBack, "monograma y empresa del reverso"],
  [BRAND.inkInverseMuted, BRAND.cardBack, "web en el reverso"],
  [BRAND.inkInverse, BRAND.backdrop, "titular y enlaces del panel"],
  [BRAND.inkInverseMuted, BRAND.backdrop, "etiquetas del panel y avisos"],
  [BRAND.accentInkInverse, BRAND.backdrop, "empresa en el panel y foco"],
  [BRAND.ink, BRAND.accent, "texto del botón de guardar contacto"],
];

/** Elementos que informan por su forma, no por su texto. */
const GRAPHICS: Array<[string, string, string]> = [
  [BRAND.accent, BRAND.cardFront, "filete de marca del anverso"],
  [BRAND.accent, BRAND.cardBack, "marco del monograma y remate del reverso"],
  [BRAND.cardEdge, BRAND.backdrop, "canto de la tarjeta contra el fondo"],
];

describe("contraste de la paleta de marca", () => {
  it("mide el contraste como manda WCAG", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrast("#767676", "#ffffff")).toBeCloseTo(4.54, 2);
    expect(contrast("#1f957a", "#1f957a")).toBeCloseTo(1, 5);
  });

  it.each(TEXT)("%s sobre %s llega a AA (%s)", (fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(GRAPHICS)("%s sobre %s se distingue (%s)", (fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(3);
  });

  it("mantiene el acento vivo fuera del texto: por eso existen sus dos tintas", () => {
    expect(contrast(BRAND.accent, BRAND.cardFront)).toBeLessThan(4.5);
    expect(contrast(BRAND.accent, BRAND.backdrop)).toBeLessThan(4.5);
  });
});
