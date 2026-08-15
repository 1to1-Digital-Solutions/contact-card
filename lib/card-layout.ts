/**
 * Qué tamaño tiene la tarjeta en el hueco que hay.
 *
 * Es una función pura de dos medidas —el hueco visible y la tarjeta, las dos
 * en unidades de mundo— para poder comprobar sin montar la escena que la
 * tarjeta cabe en cada pantalla y que aprovecha la que tiene. La escena solo
 * decide en cuál de los tres huecos está.
 */

import { clamp } from "./motion";

/** Ancho y alto, en unidades de mundo. */
export type Size = {
  width: number;
  height: number;
};

/**
 * Parte del ancho y del alto visibles que ocupa la tarjeta en reposo.
 *
 * En un hueco más alto que ancho —un móvil de pie— el ancho es el recurso
 * escaso y sobra alto: ahí la tarjeta se estira casi de borde a borde para no
 * perder protagonismo. En un móvil apaisado pasa lo contrario y además no cabe
 * nada más en pantalla: la tarjeta se lleva casi todo el alto y los mandos se
 * le ponen encima, flotando, en vez de robarle sitio.
 */
const SHARE = {
  landscape: { width: 0.62, height: 0.55 },
  portrait: { width: 0.9, height: 0.6 },
  phoneLandscape: { width: 0.86, height: 0.82 },
} as const;

/**
 * Topes de la escala. El mínimo evita que la tarjeta se quede en un sello en
 * una ventana diminuta; el máximo es una red de seguridad para un hueco casi
 * cuadrado, donde el reparto por ancho se dispara. En las pantallas de siempre
 * manda `SHARE`.
 */
const SCALE = { min: 0.25, max: 1.3 } as const;

/**
 * Cuánto hay que escalar la tarjeta para que ocupe su parte del hueco.
 *
 * @param phoneLandscape Móvil apaisado (la consulta `PHONE_LANDSCAPE`): la
 *   pantalla es toda para la tarjeta.
 */
export function cardScale(view: Size, card: Size, phoneLandscape: boolean): number {
  const share = phoneLandscape
    ? SHARE.phoneLandscape
    : view.height > view.width
      ? SHARE.portrait
      : SHARE.landscape;

  return clamp(
    Math.min(
      (view.width * share.width) / card.width,
      (view.height * share.height) / card.height,
    ),
    SCALE.min,
    SCALE.max,
  );
}
