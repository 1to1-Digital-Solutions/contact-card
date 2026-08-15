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

  /**
   * Ya está escrita dos veces (aquí y en la escena) y eso es lo que este
   * fichero vigila. Una tercera copia a mano dentro del propio CSS —para una
   * regla que no se puede poner como utilidad— se desincronizaría sin que nadie
   * se enterase: para eso está `@variant phone-landscape`.
   */
  it("no se escribe a mano una segunda vez en el CSS", () => {
    const written = CSS.match(/\(orientation: landscape\)/g) ?? [];
    expect(written).toHaveLength(1);
  });
});

/**
 * Apaisado la hoja cuelga del borde derecho, y una hoja que cuelga de la
 * derecha tiene que entrar por la derecha: el deslizamiento vertical la traería
 * desde abajo hasta un sitio en el que ya está.
 */
describe("entrada de la hoja de datos", () => {
  /** El cuerpo de `@variant phone-landscape`, con sus llaves equilibradas. */
  const landscapeRules = () => {
    const start = CSS.indexOf("@variant phone-landscape");
    if (start < 0) return "";
    const from = CSS.indexOf("{", start);
    let depth = 0;
    for (let i = from; i < CSS.length; i += 1) {
      if (CSS[i] === "{") depth += 1;
      if (CSS[i] === "}") {
        depth -= 1;
        if (depth === 0) return CSS.slice(from + 1, i);
      }
    }
    return "";
  };

  it("va por el eje X en apaisado y por el Y en el resto", () => {
    const landscape = landscapeRules();
    expect(landscape).toContain("translate: 100% 0");
    expect(landscape).not.toContain("translate: 0 100%");
    // Lo de siempre sigue fuera de la variante: la hoja de abajo no se toca.
    expect(CSS.replace(landscape, "")).toContain("translate: 0 100%");
  });

  it("solo se mueve para quien no ha pedido menos movimiento", () => {
    // El deslizamiento entero —los dos ejes— cuelga de esa preferencia: a quien
    // pide menos movimiento le queda el fundido, que no desplaza nada.
    const reduced = CSS.indexOf("@media (prefers-reduced-motion: no-preference)");
    expect(reduced).toBeGreaterThan(-1);
    expect(CSS.indexOf("translate: 100% 0")).toBeGreaterThan(reduced);
  });
});
