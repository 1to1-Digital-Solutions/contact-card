import { describe, expect, it } from "vitest";
import { entryOffsetY, INTRO_SWAY_END, introSway } from "./card-intro";

/** Instantes repartidos por toda la ventana del vaivén, de fuera a fuera. */
const samples = (from: number, to: number, step = 0.01) => {
  const times: number[] = [];
  for (let t = from; t <= to; t += step) times.push(Number(t.toFixed(4)));
  return times;
};

/** Velocidad del vaivén en un instante, medida a los dos lados. */
const speedAt = (t: number, step = 0.005) =>
  (introSway(t + step).x - introSway(t - step).x) / (2 * step);

describe("entryOffsetY", () => {
  it("deja la tarjeta entera por encima del borde de la vista", () => {
    // Lo que se ve del borde superior hacia arriba: si el canto inferior de la
    // tarjeta no llega a superarlo, la caída empieza a medio asomar.
    for (const [viewHalf, cardHalf] of [
      [1.5, 1],
      [1.5, 0.2],
      [4, 1.1],
    ]) {
      expect(entryOffsetY(viewHalf, cardHalf) - cardHalf).toBeGreaterThan(viewHalf);
    }
  });

  it("sube el punto de partida cuando la pantalla o la tarjeta crecen", () => {
    expect(entryOffsetY(2, 1)).toBeGreaterThan(entryOffsetY(1, 1));
    expect(entryOffsetY(1, 2)).toBeGreaterThan(entryOffsetY(1, 1));
  });
});

describe("introSway", () => {
  it("está quieta antes de empezar y después de terminar", () => {
    for (const t of [-1, 0, 0.5, INTRO_SWAY_END, INTRO_SWAY_END + 5]) {
      expect(introSway(t)).toEqual({ x: 0, roll: 0 });
    }
  });

  it("va y vuelve, y acaba donde empezó", () => {
    const positions = samples(0, INTRO_SWAY_END).map((t) => introSway(t).x);
    expect(Math.max(...positions)).toBeGreaterThan(0.5);
    expect(Math.min(...positions)).toBeLessThan(-0.5);
  });

  it("no se sale del recorrido que se le da", () => {
    for (const t of samples(0, INTRO_SWAY_END)) {
      const { x, roll } = introSway(t);
      expect(Math.abs(x)).toBeLessThanOrEqual(1);
      // Un balanceo de acompañamiento: por encima de esto la tarjeta vuelca.
      expect(Math.abs(roll)).toBeLessThanOrEqual(0.25);
    }
  });

  it("entra y sale sin tirón", () => {
    // El vaivén se corta a mitad de una oscilación, así que sin la campana
    // que lo envuelve el desplazamiento —y sobre todo la inclinación, que va
    // por delante— saltarían a cero de golpe en los bordes.
    const step = 0.001;
    for (const t of [step, INTRO_SWAY_END - step]) {
      const { x, roll } = introSway(t);
      expect(Math.abs(x)).toBeLessThan(0.01);
      expect(Math.abs(roll)).toBeLessThan(0.001);
    }
  });

  it("inclina la tarjeta en contra de la marcha", () => {
    // Donde el vaivén corre, la tarjeta se queda atrás: es lo que hace que
    // parezca que algo tira de ella y no que se desliza de canto.
    const times = samples(0, INTRO_SWAY_END);
    const speeds = new Map(times.map((t) => [t, speedAt(t)]));
    const fastest = Math.max(...[...speeds.values()].map(Math.abs));

    for (const [t, speed] of speeds) {
      if (Math.abs(speed) < fastest * 0.5) continue;
      expect(Math.sign(introSway(t).roll)).toBe(-Math.sign(speed));
    }
  });

  it("endereza la tarjeta en los extremos del recorrido", () => {
    // Ahí el vaivén se para para volver, y una tarjeta parada no se inclina:
    // la inclinación va un cuarto de oscilación por delante del recorrido.
    const times = samples(0, INTRO_SWAY_END);
    const tilts = times.map((t) => Math.abs(introSway(t).roll));
    const atReach = times.reduce((furthest, t) =>
      Math.abs(introSway(t).x) > Math.abs(introSway(furthest).x) ? t : furthest,
    );

    expect(Math.abs(introSway(atReach).roll)).toBeLessThan(Math.max(...tilts) * 0.25);
  });
});
