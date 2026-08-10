import { describe, expect, it } from "vitest";
import {
  hasLeftView,
  isDoubleTap,
  isTap,
  type CardBox,
  type ViewBox,
} from "./card-gestures";

const mark = (x: number, y: number, time: number) => ({ x, y, time });

describe("isTap", () => {
  it("un toque corto y quieto es un toque", () => {
    expect(isTap(mark(100, 100, 0), mark(102, 99, 90))).toBe(true);
  });

  it("un dedo que se queda apoyado no es un toque", () => {
    expect(isTap(mark(100, 100, 0), mark(100, 100, 600))).toBe(false);
  });

  it("un arrastre no es un toque, por rápido que sea", () => {
    expect(isTap(mark(100, 100, 0), mark(180, 100, 80))).toBe(false);
  });
});

describe("isDoubleTap", () => {
  it("dos toques seguidos y en el mismo sitio son un doble toque", () => {
    expect(isDoubleTap(mark(100, 100, 0), mark(108, 104, 180))).toBe(true);
  });

  it("sin toque anterior no hay doble toque", () => {
    expect(isDoubleTap(null, mark(100, 100, 180))).toBe(false);
  });

  it("aguanta un dedo lento dentro de la ventana de las plataformas", () => {
    expect(isDoubleTap(mark(100, 100, 0), mark(100, 100, 400))).toBe(true);
  });

  it("dos toques lejanos en el tiempo son dos toques sueltos", () => {
    expect(isDoubleTap(mark(100, 100, 0), mark(100, 100, 900))).toBe(false);
  });

  it("dos toques a la vez pero en puntos distintos no cuentan", () => {
    expect(isDoubleTap(mark(100, 100, 0), mark(300, 100, 180))).toBe(false);
  });
});

describe("hasLeftView", () => {
  // Las medidas de un móvil de pie: la tarjeta ocupa casi todo el ancho de
  // la vista (el 90 %) y le sobra alto por los dos lados.
  const card: CardBox = { x: 0, y: 0, halfWidth: 0.62, halfHeight: 0.4 };
  const view: ViewBox = { halfWidth: 0.69, halfHeight: 1.49 };

  it("en reposo la tarjeta está dentro", () => {
    expect(hasLeftView(card, view)).toBe(false);
  });

  it("asomada por el borde sigue estando dentro", () => {
    expect(hasLeftView({ ...card, x: 0.8 }, view)).toBe(false);
    expect(hasLeftView({ ...card, y: -1.2 }, view)).toBe(false);
  });

  it("se ha ido cuando de ella queda menos de un cuarto", () => {
    // Con el centro en 0.95 aún se ve el 29 % de su ancho; en 1.1, el 17 %.
    expect(hasLeftView({ ...card, x: 0.95 }, view)).toBe(false);
    expect(hasLeftView({ ...card, x: 1.1 }, view)).toBe(true);
    expect(hasLeftView({ ...card, x: -1.1 }, view)).toBe(true);
  });

  it("también se va por arriba y por abajo", () => {
    expect(hasLeftView({ ...card, y: 1.8 }, view)).toBe(true);
    expect(hasLeftView({ ...card, y: -1.8 }, view)).toBe(true);
  });

  it("una tarjeta más ancha que la vista no cuenta como ida por estar centrada", () => {
    const ancha: CardBox = { ...card, halfWidth: 2 };
    expect(hasLeftView(ancha, view)).toBe(false);
    expect(hasLeftView({ ...ancha, x: 2.4 }, view)).toBe(true);
  });

  it("sin vista medida todavía, la tarjeta no se da por ida", () => {
    expect(hasLeftView(card, { halfWidth: 0, halfHeight: 0 })).toBe(false);
  });

  // El umbral tiene que quedar al alcance del dedo, que no puede empujar la
  // tarjeta más allá del borde de la pantalla: si se agarra a `agarre` del
  // centro, el centro de la tarjeta llega como mucho a `viewHalf + agarre`.
  // De ahí sale el trato, y no depende del tamaño de la pantalla: se va
  // quien la agarre por la mitad exterior de su lado.
  describe("al alcance del dedo", () => {
    it("se va si se agarra por la mitad exterior del lado", () => {
      const agarre = card.halfWidth * 0.6;
      expect(hasLeftView({ ...card, x: view.halfWidth + agarre }, view)).toBe(true);

      const agarreVertical = card.halfHeight * 0.6;
      expect(
        hasLeftView({ ...card, y: -(view.halfHeight + agarreVertical) }, view),
      ).toBe(true);
    });

    it("no se va si se agarra por el centro: media tarjeta sigue dentro", () => {
      expect(hasLeftView({ ...card, x: view.halfWidth }, view)).toBe(false);
      expect(hasLeftView({ ...card, y: -view.halfHeight }, view)).toBe(false);
    });
  });
});
