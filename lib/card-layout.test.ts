import { describe, expect, it } from "vitest";
import { CARD } from "./brand";
import { cardScale, type Size } from "./card-layout";

/**
 * El hueco visible que ve la escena, en unidades de mundo. El alto no depende
 * de la pantalla: sale del ángulo de la cámara (32° a 5,2 de distancia, como
 * en `card-scene.tsx`), y el ancho, de la proporción de la ventana.
 */
const VIEW_HEIGHT = 2 * Math.tan((32 * Math.PI) / 360) * 5.2;

const view = (widthPx: number, heightPx: number): Size => ({
  width: (VIEW_HEIGHT * widthPx) / heightPx,
  height: VIEW_HEIGHT,
});

/** Pantallas de referencia, en píxeles de CSS. */
const PHONE = view(375, 812);
const PHONE_ROTATED = view(812, 375);
const DESKTOP = view(1440, 900);

/** Parte del hueco que ocupa la tarjeta a esa escala, de 0 a 1. */
const fills = (scale: number, hueco: Size) => ({
  width: (CARD.width * scale) / hueco.width,
  height: (CARD.height * scale) / hueco.height,
});

describe("cardScale", () => {
  it.each([
    ["un móvil de pie", PHONE, false],
    ["un móvil apaisado", PHONE_ROTATED, true],
    ["un móvil apaisado con el reparto de siempre", PHONE_ROTATED, false],
    ["un escritorio", DESKTOP, false],
  ] as const)("deja la tarjeta dentro de la pantalla en %s", (_, hueco, phone) => {
    const filled = fills(cardScale(hueco, CARD, phone), hueco);
    expect(filled.width).toBeLessThanOrEqual(1);
    expect(filled.height).toBeLessThanOrEqual(1);
  });

  it("en un móvil de pie se ensancha hasta casi el borde", () => {
    // Es el caso en el que el ancho es el recurso escaso: si la tarjeta se
    // reparte el hueco como en un escritorio, se queda en una miniatura.
    const filled = fills(cardScale(PHONE, CARD, false), PHONE);
    expect(filled.width).toBeGreaterThan(0.85);
  });

  it("en un móvil apaisado se lleva casi todo el alto", () => {
    // Lo que pide el modo apaisado: la tarjeta a tamaño completo, con los
    // mandos flotando encima. Fija también que el tope de escala no se le
    // coma el tamaño justo aquí, que es donde más grande tiene que salir.
    const filled = fills(cardScale(PHONE_ROTATED, CARD, true), PHONE_ROTATED);
    expect(filled.height).toBeGreaterThan(0.8);
  });

  it("en un móvil apaisado crece respecto al reparto de siempre", () => {
    const grande = cardScale(PHONE_ROTATED, CARD, true);
    const normal = cardScale(PHONE_ROTATED, CARD, false);
    expect(grande).toBeGreaterThan(normal * 1.2);
  });

  it("no encoge sin fin en una ventana diminuta", () => {
    // Una ventana de teléfono plegado o un móvil de pie muy estrecho: por
    // debajo de cierto tamaño la tarjeta deja de leerse y no compensa seguir.
    expect(cardScale(view(120, 800), CARD, false)).toBe(0.25);
  });

  it("no se dispara en una pantalla muy apaisada", () => {
    const filled = fills(cardScale(view(3440, 1440), CARD, false), view(3440, 1440));
    expect(filled.width).toBeLessThan(0.7);
    expect(filled.height).toBeLessThan(0.7);
  });
});
