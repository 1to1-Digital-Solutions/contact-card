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

  /**
   * El isotipo del favicon es el oficial, pero su lienzo no es el del icono:
   * viene en un `viewBox` que arranca en 56 y se mete en el de 64 con una
   * escala y un desplazamiento calculados a mano. Si se toca uno de los dos
   * números, el isotipo deja de estar centrado sin que se note en un favicon
   * de 16px, así que aquí se rehace la cuenta.
   */
  it("encaja el isotipo centrado dentro del lienzo del favicon", () => {
    const svg = source("../app/icon.svg");
    /**
     * El lienzo del isotipo, leído del `viewBox` del fichero que lo guarda (no
     * de sus `width`/`height`, que son otra cosa). La cuenta de abajo aplica un
     * solo origen y un solo tamaño a los dos ejes, así que el lienzo tiene que
     * ser cuadrado y arrancar en el mismo número en X y en Y.
     */
    const [minX, minY, boxWidth, boxHeight] = (
      source(`../public${LOGO.isotype.src}`).match(/viewBox="([^"]+)"/)?.[1] ?? ""
    )
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    expect(minY).toBe(minX);
    expect(boxHeight).toBe(boxWidth);
    expect(boxWidth).toBe(LOGO.isotype.width);

    const ISOTYPE = { origin: minX, size: boxWidth };
    const BOX = 64;

    const scale = Number(svg.match(/scale\(([\d.]+)\)/)?.[1]);
    const offset = svg
      .match(/translate\((-?[\d.]+)[\s,]+(-?[\d.]+)\)/)
      ?.slice(1, 3)
      .map(Number);

    expect(scale).toBeGreaterThan(0);
    expect(offset).toHaveLength(2);

    const drawn = ISOTYPE.size * scale;
    const margin = (BOX - drawn) / 2;
    expect(margin).toBeGreaterThan(0);
    for (const axis of offset!) {
      expect(ISOTYPE.origin * scale + axis).toBeCloseTo(margin, 1);
    }
  });
});

/**
 * Los dibujos de marca son los únicos que no se generan: son los ficheros
 * oficiales, copiados del sitio web. Aquí se comprueba que siguen donde `LOGO`
 * dice, que se escalan con las medidas de su propio lienzo (si no, salen
 * deformados en la textura) y que cada versión tiene el trazo que se lee sobre
 * la cara en la que se usa.
 */
describe("dibujos de marca", () => {
  const artwork = (src: string) => new URL(`../public${src}`, import.meta.url);
  const svgOf = (src: string) => readFileSync(artwork(src), "utf8");
  /** Los SVG oficiales nombran el blanco y el negro en vez de escribir su hex. */
  const NAMED: Record<string, string> = { white: "#ffffff", black: "#000000" };
  const fillsOf = (svg: string) =>
    new Set(
      [...svg.matchAll(/fill="([^"]+)"/g)]
        .map(([, value]) => value.toLowerCase())
        .filter((value) => value !== "none")
        .map((value) => NAMED[value] ?? value),
    );

  it.each(Object.entries(LOGO))("%s está en `public/`, donde apunta", (_, art) => {
    expect(existsSync(artwork(art.src))).toBe(true);
  });

  it.each(Object.entries(LOGO))(
    "%s tiene el lienzo con el que se escala",
    (_, art) => {
      const svg = svgOf(art.src);
      expect(svg).toContain(`width="${art.width}"`);
      expect(svg).toContain(`height="${art.height}"`);
    },
  );

  it("el logotipo en negativo se lee sobre el reverso", () => {
    const fills = fillsOf(svgOf(LOGO.negative.src));
    expect(fills.size).toBeGreaterThan(0);
    for (const fill of fills) {
      expect(contrast(fill, BRAND.cardBack)).toBeGreaterThanOrEqual(4.5);
    }
  });

  /**
   * El isotipo va recoloreado a mano —el SVG estático no puede leer `BRAND`—,
   * y es el que se dibuja de agua en el anverso: si dejara de ser la tinta de
   * la paleta, la marca de agua tiraría a otro tono sin que se note al 7%.
   */
  it("el isotipo va en la tinta de la paleta", () => {
    expect([...fillsOf(svgOf(LOGO.isotype.src))]).toEqual([BRAND.ink]);
  });

  /** El símbolo es el mismo que el del favicon: un único dibujo oficial. */
  it("el isotipo dibuja el mismo símbolo que el favicon", () => {
    const paths = (svg: string) =>
      [...svg.matchAll(/\sd="([^"]+)"/g)].map(([, d]) => d);
    const favicon = readFileSync(new URL("../app/icon.svg", import.meta.url), "utf8");

    expect(paths(svgOf(LOGO.isotype.src))).toEqual(paths(favicon));
  });
});
