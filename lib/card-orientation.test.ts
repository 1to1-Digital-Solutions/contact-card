import { describe, expect, it } from "vitest";
import { isShowingBack, pointerTilt, snapToHalfTurn } from "./card-orientation";

const PI = Math.PI;

describe("snapToHalfTurn", () => {
  it("deja quietos los ángulos que ya son media vuelta exacta", () => {
    expect(snapToHalfTurn(0)).toBe(0);
    expect(snapToHalfTurn(PI)).toBeCloseTo(PI, 10);
    expect(snapToHalfTurn(-2 * PI)).toBeCloseTo(-2 * PI, 10);
  });

  it("redondea a la media vuelta más cercana", () => {
    expect(snapToHalfTurn(0.4 * PI)).toBeCloseTo(0, 10);
    expect(snapToHalfTurn(0.6 * PI)).toBeCloseTo(PI, 10);
    expect(snapToHalfTurn(2.9 * PI)).toBeCloseTo(3 * PI, 10);
  });

  it("redondea igual de bien girando hacia la izquierda", () => {
    expect(snapToHalfTurn(-0.4 * PI)).toBeCloseTo(0, 10);
    expect(snapToHalfTurn(-0.6 * PI)).toBeCloseTo(-PI, 10);
    expect(snapToHalfTurn(-3.4 * PI)).toBeCloseTo(-3 * PI, 10);
  });
});

describe("isShowingBack", () => {
  it("con la tarjeta de frente enseña el anverso", () => {
    expect(isShowingBack(0)).toBe(false);
    expect(isShowingBack(2 * PI)).toBe(false);
    expect(isShowingBack(-2 * PI)).toBe(false);
  });

  it("con media vuelta enseña el reverso", () => {
    expect(isShowingBack(PI)).toBe(true);
    expect(isShowingBack(3 * PI)).toBe(true);
  });

  it("acierta también con giros hacia la izquierda", () => {
    expect(isShowingBack(-PI)).toBe(true);
    expect(isShowingBack(-3 * PI)).toBe(true);
    expect(isShowingBack(-4 * PI)).toBe(false);
  });

  it("a medio giro ya se considera vuelta la cara que más se ve", () => {
    expect(isShowingBack(0.4 * PI)).toBe(false);
    expect(isShowingBack(0.6 * PI)).toBe(true);
  });
});

describe("pointerTilt", () => {
  it("con el puntero en el centro deja la tarjeta de frente", () => {
    const { turn, pitch } = pointerTilt(0, 0);
    expect(turn).toBeCloseTo(0, 10);
    expect(pitch).toBeCloseTo(0, 10);
  });

  it("hunde el lado por el que pasa el puntero", () => {
    // Un giro positivo alrededor del eje vertical aleja el borde derecho, y
    // uno positivo alrededor del horizontal acerca el superior: con el
    // puntero arriba a la derecha, esa esquina es la que se va hacia el fondo.
    const { turn, pitch } = pointerTilt(1, 1);
    expect(turn).toBeGreaterThan(0);
    expect(pitch).toBeLessThan(0);
  });

  it("se asoma igual hacia el otro lado", () => {
    const derecha = pointerTilt(0.6, 0.3);
    const izquierda = pointerTilt(-0.6, -0.3);
    expect(izquierda.turn).toBeCloseTo(-derecha.turn, 10);
    expect(izquierda.pitch).toBeCloseTo(-derecha.pitch, 10);
  });

  it("es un asomo, no un giro", () => {
    // Se suma al giro que pide el usuario, así que tiene que quedarse en un
    // gesto: si creciera, bastaría pasar el ratón para acabar viendo el canto.
    const { turn, pitch } = pointerTilt(1, 1);
    expect(Math.abs(turn)).toBeLessThan(0.35);
    expect(Math.abs(pitch)).toBeLessThan(0.35);
  });

  it("no se pasa de rosca con el puntero fuera del lienzo", () => {
    // La escena entrega coordenadas más allá de 1 mientras se arrastra con el
    // puntero capturado fuera de la ventana.
    expect(pointerTilt(9, -4)).toEqual(pointerTilt(1, -1));
  });
});
