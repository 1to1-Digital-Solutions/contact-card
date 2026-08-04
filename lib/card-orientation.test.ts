import { describe, expect, it } from "vitest";
import { isShowingBack, snapToHalfTurn } from "./card-orientation";

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
