import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { BRAND, THEMES } from "@/lib/brand";
import { contactIn, JOB_TITLE } from "@/lib/contact";
import { DEFAULT_LANGUAGE } from "@/lib/i18n";
import { buildMetadata } from "@/lib/metadata";
import { DEFAULT_THEME } from "@/lib/theme";
import Image, { alt, contentType, size } from "./opengraph-image";
import * as twitter from "./twitter-image";

/**
 * La previsualización al compartir es lo primero que se ve del enlace y no hay
 * navegador que la revise: aquí se genera de verdad y se le miran los píxeles.
 * Lo que se comprueba es que el color sale de la paleta de marca —ningún tono
 * escrito a mano— y que los metadatos que la declaran siguen en su sitio.
 */

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

/** La imagen se genera una vez: el renderizado va por WebAssembly y no es gratis. */
const png = Buffer.from(await (await Image()).arrayBuffer());

type Bitmap = {
  width: number;
  height: number;
  counts: Map<string, number>;
  /** El color de un píxel, en la misma notación que la paleta. */
  at: (x: number, y: number) => string;
};

/**
 * Decodifica el PNG a un recuento de colores. No hay librería de imagen en el
 * proyecto y tampoco hace falta: basta con leer la cabecera, descomprimir los
 * datos y deshacer el filtro de cada línea (PNG, RFC 2083 §6), que es lo que
 * separa los bytes crudos de los píxeles.
 */
function decodePng(bytes: Buffer): Bitmap {
  expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);

  let header: { width: number; height: number; depth: number; color: number } | undefined;
  const chunks: Buffer[] = [];
  for (let at = 8; at < bytes.length; ) {
    const length = bytes.readUInt32BE(at);
    const type = bytes.toString("ascii", at + 4, at + 8);
    const data = bytes.subarray(at + 8, at + 8 + length);
    if (type === "IHDR") {
      header = {
        width: data.readUInt32BE(0),
        height: data.readUInt32BE(4),
        depth: data[8],
        color: data[9],
      };
    }
    if (type === "IDAT") chunks.push(data);
    // Cada trozo lleva 4 bytes de longitud, 4 de tipo y 4 de suma de control.
    at += 12 + length;
  }

  expect(header).toBeDefined();
  const { width, height, depth, color } = header!;
  // El generador escribe color verdadero de 8 bits con alfa; el resto de
  // combinaciones que admite el formato no se sabrían leer aquí.
  expect([depth, color]).toEqual([8, 6]);

  const CHANNELS = 4;
  const stride = width * CHANNELS;
  const raw = inflateSync(Buffer.concat(chunks));
  const pixels = Buffer.alloc(height * stride);

  for (let y = 0, at = 0; y < height; y++) {
    const filter = raw[at++];
    for (let i = 0; i < stride; i++) {
      const left = i >= CHANNELS ? pixels[y * stride + i - CHANNELS] : 0;
      const up = y > 0 ? pixels[(y - 1) * stride + i] : 0;
      const corner = i >= CHANNELS && y > 0 ? pixels[(y - 1) * stride + i - CHANNELS] : 0;
      pixels[y * stride + i] = (raw[at + i] + undoFilter(filter, left, up, corner)) & 255;
    }
    at += stride;
  }

  const counts = new Map<string, number>();
  for (let i = 0; i < pixels.length; i += CHANNELS) {
    const hex = `#${pixels.subarray(i, i + 3).toString("hex")}`;
    counts.set(hex, (counts.get(hex) ?? 0) + 1);
  }

  const at = (x: number, y: number) => {
    const i = y * stride + x * CHANNELS;
    return `#${pixels.subarray(i, i + 3).toString("hex")}`;
  };
  return { width, height, counts, at };
}

/** Lo que el filtro de la línea le restó al píxel: sus vecinos, según el tipo. */
function undoFilter(filter: number, left: number, up: number, corner: number): number {
  switch (filter) {
    case 0:
      return 0;
    case 1:
      return left;
    case 2:
      return up;
    case 3:
      return (left + up) >> 1;
    case 4: {
      // Paeth: se queda con el vecino que menos se aparta de la suma de los tres.
      const estimate = left + up - corner;
      const [dLeft, dUp, dCorner] = [left, up, corner].map((v) =>
        Math.abs(estimate - v),
      );
      if (dLeft <= dUp && dLeft <= dCorner) return left;
      return dUp <= dCorner ? up : corner;
    }
    default:
      throw new Error(`Filtro PNG desconocido: ${filter}`);
  }
}

const image = decodePng(png);
const PIXELS = image.width * image.height;

/** El tema con el que se abre la página, que es del que va la imagen. */
const THEME = THEMES[DEFAULT_THEME];

/** La imagen va en un solo idioma, el de recurso: es el que lleva sus textos. */
const CONTACT = contactIn(DEFAULT_LANGUAGE);
const metadata = buildMetadata(DEFAULT_LANGUAGE);

/** Los tokens que la imagen tiene derecho a pintar: la paleta y nada más. */
const PALETTE = new Set<string>([...Object.values(BRAND), ...Object.values(THEME)]);

describe("imagen de Open Graph", () => {
  it("es un PNG del tamaño que declaran los metadatos", () => {
    expect(size).toEqual({ width: 1200, height: 630 });
    expect(contentType).toBe("image/png");
    expect([image.width, image.height]).toEqual([size.width, size.height]);
  });

  /**
   * El umbral deja fuera el suavizado de los bordes del texto y de las esquinas
   * redondeadas, que son mezclas de los colores de al lado: lo que se vigila es
   * que ninguna superficie de verdad venga de un tono inventado.
   */
  it("no pinta ninguna superficie con un color de fuera de la paleta", () => {
    const painted = [...image.counts]
      .filter(([, count]) => count >= PIXELS * 0.005)
      .map(([hex]) => hex);

    expect(painted.length).toBeGreaterThan(0);
    for (const hex of painted) expect(PALETTE).toContain(hex);
  });

  /** Cada token que dibuja algo reconocible: si uno desaparece, el diseño cambió. */
  const drawn: Array<[string, string]> = [
    [THEME.backdrop, "el fondo de la escena alrededor de la tarjeta"],
    [THEME.card, "la cara de la tarjeta"],
    [THEME.cardEdge, "el canto que la separa del fondo"],
    [THEME.ink, "el nombre y los datos"],
    [THEME.inkMuted, "el cargo"],
    [THEME.accentInk, "la empresa"],
    [BRAND.accent, "el filete y el logotipo"],
  ];

  it.each(drawn)("pinta %s: %s", (hex) => {
    expect(image.counts.get(hex) ?? 0).toBeGreaterThan(0);
  });

  /**
   * El verde también está en el logotipo, así que la presencia del token no
   * basta para saber que el filete sigue ahí: se busca donde vive. A media
   * altura el canto de la tarjeta es recto, de modo que lo primero que aparece
   * al entrar desde el borde izquierdo tiene que ser el filete.
   */
  it("lleva el filete de marca en el canto izquierdo de la tarjeta", () => {
    const middle = Math.round(image.height / 2);
    let x = 0;
    while (x < image.width && image.at(x, middle) === THEME.backdrop) x++;

    expect(x).toBeGreaterThan(0);
    expect(x).toBeLessThan(image.width);
    expect(image.at(x, middle)).toBe(BRAND.accent);
  });

  it("va del tema de partida, que es con el que se abre la página", () => {
    const dominant = [...image.counts].sort((a, b) => b[1] - a[1])[0][0];
    expect(dominant).toBe(THEME.card);
  });

  /** Como en el favicon y en el `themeColor`: los colores se piden a la paleta. */
  it("no lleva ningún color escrito a mano", () => {
    expect(source("./opengraph-image.tsx").match(/#[0-9a-f]{6}\b/gi)).toBeNull();
  });

  /**
   * El otro lado del mismo trato: los textos tampoco se copian. Si un dato
   * apareciera aquí escrito, cambiarlo en `lib/contact.ts` dejaría la
   * previsualización enseñando el viejo, que es justo lo que no puede pasar.
   */
  it("no lleva ningún dato de contacto escrito a mano", () => {
    const code = source("./opengraph-image.tsx");
    const data = [...Object.values(CONTACT), ...Object.values(JOB_TITLE)];
    for (const value of data) expect(code).not.toContain(value);
  });
});

describe("metadatos de la previsualización", () => {
  it("describe la imagen con los datos del contacto, no con un texto suelto", () => {
    expect(alt).toContain(CONTACT.name);
    expect(alt).toContain(CONTACT.jobTitle);
    expect(alt).toContain(CONTACT.company);
  });

  it("da a Twitter/X la misma imagen que a Open Graph", () => {
    expect(twitter.default).toBe(Image);
    expect([twitter.alt, twitter.contentType, twitter.size]).toEqual([
      alt,
      contentType,
      size,
    ]);
  });

  it("pide la tarjeta grande, que es la que enseña la imagen entera", () => {
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
  });

  /** La imagen la declara la convención de ficheros: si además se listara a
   *  mano en `openGraph.images`, saldrían dos y ganaría la escrita a mano. */
  it("no declara la imagen a mano en los metadatos", () => {
    expect(metadata.openGraph).not.toHaveProperty("images");
    expect(metadata.twitter).not.toHaveProperty("images");
  });

  it("apunta la previsualización a la misma URL que el canónico", () => {
    expect(metadata.openGraph).toMatchObject({ url: metadata.alternates?.canonical });
  });
});
