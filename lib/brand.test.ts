import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { type ThemeName, BRAND, LOGO, THEMES, WATERMARK } from "./brand";

/**
 * Los tokens de marca solo valen si el texto se lee encima de su fondo. Aquí
 * está fijada cada combinación que existe en la tarjeta y en la página, en los
 * dos temas, con el umbral que le toca: 4.5:1 para texto (WCAG 2.2, criterio
 * 1.4.3 AA) y 3:1 para lo que es solo forma (1.4.11).
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

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const CSS = source("../app/globals.css");

/** Las declaraciones de un bloque de `app/globals.css`, por nombre de variable. */
function declarationsIn(selector: RegExp): Map<string, string> {
  const body = CSS.match(selector)?.[1] ?? "";
  return new Map(
    [...body.matchAll(/(--[a-z-]+):\s*([^;]+);/g)].map(([, name, value]) => [
      name,
      value.trim(),
    ]),
  );
}

const BLOCKS = {
  theme: declarationsIn(/@theme inline\s*\{([\s\S]*?)\n\}/),
  shared: declarationsIn(/\n:root\s*\{([\s\S]*?)\n\}/),
  dark: declarationsIn(/:root,\n\.dark\s*\{([\s\S]*?)\n\}/),
  light: declarationsIn(/\n\.light\s*\{([\s\S]*?)\n\}/),
};

/**
 * El fondo NO es `backdrop` a secas donde vive el texto de la escena: encima
 * llevan la veladura del `body` y el halo de la tarjeta, que lo mueven (en el
 * tema oscuro lo aclaran y en el claro lo oscurecen). El peor caso es el
 * centro de la escena —ahí se lee «Cargando la tarjeta…» y la nota de la
 * versión plana—: el halo entero sobre la veladura más fuerte, que es la
 * única que llega hasta ahí (las dos están en esquinas opuestas). Las dos
 * opacidades y la tinta del halo se leen del CSS para que no puedan
 * desincronizarse.
 */
function litBackdrop(theme: ThemeName): string {
  const block = BLOCKS[theme];
  const number = (name: string) => Number(block.get(name));
  return blend(
    block.get("--halo-color")!,
    number("--halo"),
    blend(BRAND.accent, number("--glaze-b"), block.get("--backdrop")!),
  );
}

/** Pares de texto sobre fondo, con dónde aparece cada uno. */
function textPairs(theme: ThemeName): Array<[string, string, string]> {
  const { card, backdrop, ink, inkMuted, accentInk } = THEMES[theme];
  const lit = litBackdrop(theme);
  return [
    [ink, card, "nombre y datos del anverso"],
    [inkMuted, card, "cargo y etiquetas del anverso, web del reverso"],
    [accentInk, card, "empresa en el anverso"],
    [ink, backdrop, "titular y enlaces del panel"],
    [inkMuted, backdrop, "etiquetas del panel"],
    [accentInk, backdrop, "empresa en la cabecera"],
    [BRAND.onAccent, BRAND.accent, "texto del botón de guardar contacto"],
    [ink, lit, "mandos de la escena sobre el fondo velado"],
    [inkMuted, lit, "«Cargando la tarjeta…» y la nota de la versión plana"],
  ];
}

/** Elementos que informan por su forma, no por su texto. */
function graphicPairs(theme: ThemeName): Array<[string, string, string]> {
  const { card, accentInk } = THEMES[theme];
  return [
    [BRAND.accent, card, "filete del anverso y remate del reverso"],
    [accentInk, litBackdrop(theme), "foco del teclado sobre la escena"],
    [accentInk, card, "foco del teclado sobre la tarjeta plana"],
  ];
}

describe("contraste de la paleta de marca", () => {
  it("mide el contraste como manda WCAG", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrast("#767676", "#ffffff")).toBeCloseTo(4.54, 2);
    expect(contrast("#1f957a", "#1f957a")).toBeCloseTo(1, 5);
  });

  for (const theme of ["dark", "light"] as const) {
    describe(`tema ${theme}`, () => {
      it.each(textPairs(theme))("%s sobre %s llega a AA (%s)", (fg, bg) => {
        expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
      });

      it.each(graphicPairs(theme))("%s sobre %s se distingue (%s)", (fg, bg) => {
        expect(contrast(fg, bg)).toBeGreaterThanOrEqual(3);
      });

      it("mantiene el acento vivo fuera del texto: por eso existe `accentInk`", () => {
        expect(contrast(BRAND.accent, THEMES[theme].card)).toBeLessThan(4.5);
      });

      /** El canto es la cara desviada un escalón, no un color ajeno: si se separase
       *  demasiado, volvería a verse encendido por las esquinas redondeadas de la
       *  textura, que es justo lo que se quitó de en medio. */
      it("deja el canto a un paso del color de la cara", () => {
        const { card, cardEdge } = THEMES[theme];
        expect(contrast(card, cardEdge)).toBeGreaterThan(1);
        expect(contrast(card, cardEdge)).toBeLessThan(1.5);
      });
    });
  }
});

/** `inkMuted` → `--ink-muted`, el nombre que tiene la misma variable en el CSS. */
function cssVariable(token: string): string {
  return `--${token.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
}

describe("paleta duplicada en app/globals.css", () => {
  it("encuentra los tres bloques y sus declaraciones", () => {
    expect(BLOCKS.theme.size).toBeGreaterThan(0);
    expect(BLOCKS.dark.size).toBeGreaterThan(0);
    expect(BLOCKS.light.size).toBeGreaterThan(0);
  });

  it.each(Object.entries(BRAND))(
    "%s vale lo mismo en `lib/brand.ts` y en el CSS",
    (token, value) => {
      expect(BLOCKS.shared.get(cssVariable(token))).toBe(value);
    },
  );

  for (const [theme, palette] of Object.entries(THEMES)) {
    it.each(Object.entries(palette))(
      `${theme}: %s vale lo mismo en \`lib/brand.ts\` y en el CSS`,
      (token, value) => {
        expect(BLOCKS[theme as ThemeName].get(cssVariable(token))).toBe(value);
      },
    );
  }

  it("expone en `@theme` exactamente los colores que conoce `lib/brand.ts`", () => {
    const expected = [...Object.keys(BRAND), ...Object.keys(THEMES.dark)]
      .map(cssVariable)
      .sort();
    const declared = [...BLOCKS.theme.keys()]
      .filter((name) => name.startsWith("--color-"))
      .map((name) => name.replace("--color-", "--"))
      .sort();

    expect(declared).toEqual(expected);
  });

  it("hace que las utilidades apunten a la variable del tema, no a su valor", () => {
    for (const token of Object.keys(THEMES.dark)) {
      const variable = cssVariable(token);
      expect(BLOCKS.theme.get(`--color${variable.slice(1)}`)).toBe(`var(${variable})`);
    }
  });
});

/**
 * Los dos sitios que no leen el CSS: los metadatos de Next y el favicon. El
 * `themeColor` ya sale de la paleta (`CHROME_COLOR`), así que aquí solo se
 * vigila que nadie vuelva a escribirlo a mano; el favicon, en cambio, es un
 * SVG estático y sus colores sí van copiados.
 */
describe("colores fuera del CSS", () => {
  const hexesIn = (text: string) =>
    [...text.matchAll(/#[0-9a-f]{6}\b/gi)].map(([hex]) => hex.toLowerCase());

  it("saca el `themeColor` de la paleta y no de un color escrito a mano", () => {
    const layout = source("../app/layout.tsx");
    expect(layout).toContain("themeColor: CHROME_COLOR[DEFAULT_THEME]");
    expect(hexesIn(layout)).toEqual([]);
  });

  it("el favicon es el isotipo de marca sobre la tarjeta oscura", () => {
    const used = [...new Set(hexesIn(source("../app/icon.svg")))].sort();
    expect(used).toEqual([THEMES.dark.card, BRAND.accent].sort());
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
 * deformados en la textura) y que cada versión lleva la tinta que se lee sobre
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
  const pathsOf = (svg: string) => [...svg.matchAll(/\sd="([^"]+)"/g)].map(([, d]) => d);

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

  /** Un solo logotipo con tres tintas: si una versión se cambia por otra, deja
   *  de dibujar lo mismo y hay que traerla otra vez de la marca. */
  it("las tres versiones del logotipo dibujan el mismo trazado", () => {
    const reference = pathsOf(svgOf(LOGO.brand.src));
    expect(reference.length).toBeGreaterThan(0);
    expect(pathsOf(svgOf(LOGO.positive.src))).toEqual(reference);
    expect(pathsOf(svgOf(LOGO.negative.src))).toEqual(reference);
  });

  it("el logotipo del reverso va en el verde de marca", () => {
    expect([...fillsOf(svgOf(LOGO.brand.src))]).toEqual([BRAND.accent]);
  });

  /**
   * El logotipo del reverso es el mismo en los dos temas, así que su verde
   * tiene que distinguirse sobre las dos caras. Como grafismo le basta 3:1: el
   * texto que lleva dentro es la marca, que WCAG 1.4.3 deja fuera del umbral
   * de texto.
   */
  it.each(["dark", "light"] as const)(
    "el logotipo del reverso se distingue sobre la cara %s",
    (theme) => {
      expect(contrast(BRAND.accent, THEMES[theme].card)).toBeGreaterThanOrEqual(3);
    },
  );

  it.each(["dark", "light"] as const)(
    "la marca de agua del anverso %s lleva la tinta que se lee sobre esa cara",
    (theme) => {
      const fills = [...fillsOf(svgOf(WATERMARK[theme].src))];
      expect(fills.length).toBeGreaterThan(0);
      for (const fill of fills) {
        expect(contrast(fill, THEMES[theme].card)).toBeGreaterThanOrEqual(4.5);
      }
    },
  );

  /** El símbolo del favicon sale de aquí: un único dibujo oficial. */
  it("el isotipo dibuja el mismo símbolo que el favicon", () => {
    expect(pathsOf(svgOf(LOGO.isotype.src))).toEqual(pathsOf(source("../app/icon.svg")));
  });
});
