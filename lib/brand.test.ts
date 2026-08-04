import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BRAND, LOGO } from "./brand";

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

/** Superpone `top` con opacidad `alpha` sobre `bottom`, como hace el navegador. */
function blend(top: string, alpha: number, bottom: string): string {
  const t = Number.parseInt(top.slice(1), 16);
  const b = Number.parseInt(bottom.slice(1), 16);
  const channel = (shift: number) =>
    Math.round(((t >> shift) & 255) * alpha + ((b >> shift) & 255) * (1 - alpha));
  return `#${[16, 8, 0]
    .map((shift) => channel(shift).toString(16).padStart(2, "0"))
    .join("")}`;
}

/**
 * El fondo NO es `backdrop` a secas donde vive el texto de la escena: encima
 * llevan las veladuras del `body` y el halo de la tarjeta (`app/globals.css`),
 * que lo aclaran. El peor caso es el centro de la escena —ahí se lee «Cargando
 * la tarjeta…» y la nota de la versión plana—: el halo al completo sobre la
 * veladura más fuerte. Las dos veladuras están en esquinas opuestas del
 * viewport, así que nunca se suman a plena intensidad.
 * Si cambian esas opacidades en el CSS, cambian aquí.
 */
const BACKDROP_LIT = blend(
  "#ffffff",
  0.09,
  blend(BRAND.accentInk, 0.22, BRAND.backdrop),
);

/** Pares de texto sobre fondo, con dónde aparece cada uno. */
const TEXT: Array<[string, string, string]> = [
  [BRAND.ink, BRAND.cardFront, "nombre y datos del anverso"],
  [BRAND.inkMuted, BRAND.cardFront, "etiquetas del anverso"],
  [BRAND.accentInk, BRAND.cardFront, "empresa en el anverso"],
  [BRAND.inkInverseMuted, BRAND.cardBack, "web en el reverso"],
  [BRAND.inkInverse, BRAND.backdrop, "titular y enlaces del panel"],
  [BRAND.inkInverseMuted, BRAND.backdrop, "etiquetas del panel y avisos"],
  [BRAND.accentInkInverse, BRAND.backdrop, "empresa en el panel y foco"],
  [BRAND.ink, BRAND.accent, "texto del botón de guardar contacto"],
  [BRAND.inkInverse, BACKDROP_LIT, "avisos de la escena sobre el fondo aclarado"],
  [
    BRAND.inkInverseMuted,
    BACKDROP_LIT,
    "«Cargando la tarjeta…» y la nota de la versión plana",
  ],
];

/** Elementos que informan por su forma, no por su texto. */
const GRAPHICS: Array<[string, string, string]> = [
  [BRAND.accent, BRAND.cardFront, "filete de marca del anverso"],
  [BRAND.accent, BRAND.cardBack, "remate del reverso e isotipo del favicon"],
  [BRAND.cardEdge, BRAND.backdrop, "canto de la tarjeta contra el fondo"],
  [BRAND.accentInkInverse, BACKDROP_LIT, "foco del teclado sobre la escena"],
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

/** `inkInverseMuted` → `--color-ink-inverse-muted`, el nombre que usa Tailwind. */
function cssVariable(token: string): string {
  return `--color-${token.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
}

/** Tokens que solo existen en three.js: no tienen clase de Tailwind que los use. */
const ONLY_IN_THREE = new Set(["cardEdge"]);

describe("paleta duplicada en @theme", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const theme = css.match(/@theme\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
  const declared = new Map(
    [...theme.matchAll(/(--color-[a-z-]+):\s*([^;]+);/g)].map(([, name, value]) => [
      name,
      value.trim(),
    ]),
  );

  it("encuentra el bloque @theme y sus colores", () => {
    expect(declared.size).toBeGreaterThan(0);
  });

  it.each(Object.entries(BRAND).filter(([token]) => !ONLY_IN_THREE.has(token)))(
    "%s vale lo mismo en `lib/brand.ts` y en `app/globals.css`",
    (token, value) => {
      expect(declared.get(cssVariable(token))).toBe(value);
    },
  );

  it("no declara en @theme colores que three.js no conozca", () => {
    const fromBrand = new Set(Object.keys(BRAND).map(cssVariable));
    expect([...declared.keys()].filter((name) => !fromBrand.has(name))).toEqual([]);
  });
});

/**
 * Los dos sitios que no pueden leer ni `BRAND` ni el `@theme`: los metadatos
 * de Next (`themeColor` es un string en el módulo de servidor) y el favicon,
 * que es un SVG estático. Ahí los colores van copiados a mano, así que aquí
 * se comprueba que siguen siendo los de la paleta y no los de la anterior.
 */
describe("colores copiados a mano fuera de la paleta", () => {
  const source = (path: string) =>
    readFileSync(new URL(path, import.meta.url), "utf8");
  const hexesIn = (text: string) =>
    [...text.matchAll(/#[0-9a-f]{6}\b/gi)].map(([hex]) => hex.toLowerCase());

  it("el `themeColor` de la pestaña es el fondo de la página", () => {
    const declared = source("../app/layout.tsx").match(
      /themeColor:\s*"(#[0-9a-f]{6})"/i,
    )?.[1];
    expect(declared).toBe(BRAND.backdrop);
  });

  it("el favicon es el isotipo de marca sobre el reverso de la tarjeta", () => {
    const used = [...new Set(hexesIn(source("../app/icon.svg")))].sort();
    expect(used).toEqual([BRAND.cardBack, BRAND.accent].sort());
  });
});

/**
 * El logotipo es el único dibujo que no se genera: es el fichero oficial de la
 * marca, copiado del sitio web. Aquí se comprueba que sigue donde `LOGO` dice,
 * que se escala con las medidas de su propio lienzo (si no, sale deformado en
 * la textura del reverso) y que es la versión en negativo, que es la que se lee
 * sobre el reverso oscuro.
 */
describe("logotipo de marca", () => {
  const file = new URL(`../public${LOGO.src}`, import.meta.url);
  /** El SVG oficial nombra el blanco en vez de escribir su hex. */
  const NAMED: Record<string, string> = { white: "#ffffff", black: "#000000" };

  it("está en `public/`, en la ruta que apunta `LOGO`", () => {
    expect(existsSync(file)).toBe(true);
  });

  it("tiene el lienzo con el que se escala", () => {
    const svg = readFileSync(file, "utf8");
    expect(svg).toContain(`width="${LOGO.width}"`);
    expect(svg).toContain(`height="${LOGO.height}"`);
  });

  it("va en negativo: sus trazos se leen sobre el reverso", () => {
    const svg = readFileSync(file, "utf8");
    const fills = [...svg.matchAll(/fill="([^"]+)"/g)]
      .map(([, value]) => value.toLowerCase())
      .filter((value) => value !== "none");

    expect(fills.length).toBeGreaterThan(0);
    for (const fill of new Set(fills)) {
      expect(contrast(NAMED[fill] ?? fill, BRAND.cardBack)).toBeGreaterThanOrEqual(
        4.5,
      );
    }
  });
});
