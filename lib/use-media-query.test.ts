import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { PHONE_LANDSCAPE } from "./use-media-query";

/**
 * El reparto de la pantalla en un móvil apaisado lo hacen dos a la vez: el CSS
 * mueve los mandos y esconde el título, y la escena le da su tamaño a la
 * tarjeta. Si cada uno usa un corte distinto queda un tramo en el que la
 * tarjeta se hace grande con los mandos todavía en medio, o al revés.
 */

const CSS = readFileSync(fileURLToPath(new URL("../app/globals.css", import.meta.url)), "utf8");

describe("consulta del móvil apaisado", () => {
  it("es la misma en la escena que en la variante de Tailwind", () => {
    const variant = CSS.match(/@custom-variant phone-landscape \(@media ([\s\S]*?)\);/)?.[1];
    expect(variant).toBe(PHONE_LANDSCAPE);
  });

  it("se queda por debajo del ancho del panel fijo", () => {
    // A partir de `lg` los datos van en una columna al lado y la escena ya no
    // tiene la pantalla entera: ahí este modo no pinta nada.
    expect(PHONE_LANDSCAPE).toContain("max-width");
  });
});
