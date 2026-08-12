import { describe, expect, it } from "vitest";
import {
  clamp,
  smoothTowards,
  stepSpring,
  type SmoothConfig,
  type SpringConfig,
  type SpringState,
} from "./motion";

const CONFIG: SpringConfig = { stiffness: 180, damping: 26 };

/** Simula `seconds` segundos a 60 fps y devuelve el estado final. */
function simulate(
  state: SpringState,
  target: number,
  seconds: number,
  config = CONFIG,
): SpringState {
  const dt = 1 / 60;
  let current = state;
  for (let t = 0; t < seconds; t += dt) {
    current = stepSpring(current, target, config, dt);
  }
  return current;
}

describe("stepSpring", () => {
  it("converge al objetivo y se detiene", () => {
    const final = simulate({ value: 0, velocity: 0 }, 5, 3);
    expect(final.value).toBeCloseTo(5, 3);
    expect(Math.abs(final.velocity)).toBeLessThan(0.01);
  });

  it("se mueve hacia el objetivo desde el primer paso", () => {
    const after = stepSpring({ value: 0, velocity: 0 }, 1, CONFIG, 1 / 60);
    expect(after.value).toBeGreaterThan(0);
    expect(after.value).toBeLessThan(1);
  });

  it("funciona igual con el objetivo por debajo del valor actual", () => {
    const final = simulate({ value: 10, velocity: 0 }, -2, 3);
    expect(final.value).toBeCloseTo(-2, 3);
  });

  it("no diverge con un delta grande (pestaña en segundo plano)", () => {
    // Sin subdividir el paso de integración, este delta hace explotar a Euler.
    const after = stepSpring({ value: 0, velocity: 0 }, 1, CONFIG, 0.5);
    expect(Number.isFinite(after.value)).toBe(true);
    expect(Math.abs(after.value)).toBeLessThan(2);
  });

  it("conserva la energía inicial: una velocidad de entrada sobrepasa el objetivo", () => {
    const suave: SpringConfig = { stiffness: 120, damping: 6 };
    const after = stepSpring({ value: 0, velocity: 20 }, 0, suave, 1 / 60);
    expect(after.value).toBeGreaterThan(0);
  });

  it("con más amortiguación tarda más en llegar", () => {
    const blando = simulate({ value: 0, velocity: 0 }, 1, 0.2, {
      stiffness: 180,
      damping: 12,
    });
    const rigido = simulate({ value: 0, velocity: 0 }, 1, 0.2, {
      stiffness: 180,
      damping: 60,
    });
    expect(blando.value).toBeGreaterThan(rigido.value);
  });

  it("ignora los deltas nulos o negativos", () => {
    const state = { value: 3, velocity: 1 };
    expect(stepSpring(state, 0, CONFIG, 0)).toBe(state);
    expect(stepSpring(state, 0, CONFIG, -1)).toBe(state);
  });

  it("la masa frena la respuesta", () => {
    const ligero = simulate({ value: 0, velocity: 0 }, 1, 0.15, {
      ...CONFIG,
      mass: 1,
    });
    const pesado = simulate({ value: 0, velocity: 0 }, 1, 0.15, {
      ...CONFIG,
      mass: 4,
    });
    expect(pesado.value).toBeLessThan(ligero.value);
  });
});

describe("smoothTowards", () => {
  const SMOOTH: SmoothConfig = { halfLife: 0.04, rest: 0.0005 };
  const FRAME = 1 / 60;

  /** Suaviza `seconds` segundos a 60 fps hacia un objetivo que no se mueve. */
  function follow(from: number, target: number, seconds: number, config = SMOOTH) {
    let value = from;
    for (let t = 0; t < seconds; t += FRAME) {
      value = smoothTowards(value, target, config, FRAME);
    }
    return value;
  }

  it("recorre la mitad de lo que falta en cada vida media", () => {
    expect(smoothTowards(0, 1, SMOOTH, SMOOTH.halfLife)).toBeCloseTo(0.5, 6);
    expect(smoothTowards(0, 1, SMOOTH, SMOOTH.halfLife * 2)).toBeCloseTo(0.75, 6);
  });

  /**
   * Los recorridos van en coordenadas de puntero, que es donde se usa el
   * filtro: de -1 a 1, así que 1 es media pantalla y 2 el peor caso posible.
   */
  it("se planta en el objetivo en vez de quedarse flotando cerca", () => {
    // Sin el umbral de reposo esto seguiría acercándose sin llegar nunca, y la
    // tarjeta seguiría moviéndose —cada vez menos— con el ratón ya quieto.
    expect(follow(0, 1, 0.5)).toBe(1);
  });

  it("no tarda en pararse: medio segundo basta para el recorrido más largo", () => {
    expect(follow(1, -1, 0.5)).toBe(-1);
  });

  it("no depende de la tasa de refresco", () => {
    // Los mismos 200 ms en 12 pasos (60 fps) y en 6 (30 fps) dejan la señal en
    // el mismo sitio: quien va a 30 fps ve el mismo gesto, no uno más lento.
    const over = (steps: number) => {
      let value = 0;
      for (let i = 0; i < steps; i++) value = smoothTowards(value, 1, SMOOTH, 0.2 / steps);
      return value;
    };
    expect(over(6)).toBeCloseTo(over(12), 6);
  });

  it("reparte el recorrido en el tiempo pero no se come nada", () => {
    // El giro suma los avances del puntero amortiguado frame a frame: si el
    // filtro perdiera parte del camino, el mismo gesto giraría menos que antes.
    let value = 0;
    let travelled = 0;
    for (let i = 0; i < 60; i++) {
      const next = smoothTowards(value, 0.8, SMOOTH, FRAME);
      travelled += next - value;
      value = next;
    }
    expect(travelled).toBeCloseTo(0.8, 10);
  });

  /**
   * El de arriba mide un objetivo quieto. Con el objetivo en marcha el filtro
   * va por detrás y en todo momento le queda un trozo sin repartir: a la
   * velocidad de un golpe de muñeca son ~0,17 unidades de puntero, que en el
   * giro de la tarjeta pasan de 30°. Por eso quien sume los avances frame a
   * frame —el gesto de girar— tiene que cobrarse ese resto al soltar: lo
   * repartido más lo que falta es, exactamente, todo lo que se movió.
   */
  it("va por detrás de un objetivo en marcha y deja un resto sin repartir", () => {
    /** Tres unidades de puntero por segundo: un ratón moviéndose deprisa. */
    const STEP = 3 * FRAME;
    let value = 0;
    let target = 0;
    let delivered = 0;
    for (let i = 0; i < 30; i++) {
      target += STEP;
      const next = smoothTowards(value, target, SMOOTH, FRAME);
      delivered += next - value;
      value = next;
    }
    expect(target - value).toBeGreaterThan(0.1);
    expect(delivered + (target - value)).toBeCloseTo(target, 10);
  });

  it("no sobrepasa el objetivo ni rebota, a diferencia del muelle", () => {
    let value = 0;
    for (let i = 0; i < 60; i++) {
      const next = smoothTowards(value, 1, SMOOTH, FRAME);
      expect(next).toBeGreaterThanOrEqual(value);
      expect(next).toBeLessThanOrEqual(1);
      value = next;
    }
  });

  it("sin vida media deja pasar el objetivo tal cual", () => {
    // Es lo que reciben el dedo y quien ha pedido menos movimiento: el gesto
    // sin filtrar, igual que antes de que existiera este suavizado.
    const direct: SmoothConfig = { halfLife: 0, rest: 0 };
    expect(smoothTowards(0, 0.37, direct, FRAME)).toBe(0.37);
  });

  it("ignora los deltas nulos o negativos", () => {
    expect(smoothTowards(3, 0, SMOOTH, 0)).toBe(3);
    expect(smoothTowards(3, 0, SMOOTH, -1)).toBe(3);
  });

  it("funciona igual acercándose desde arriba", () => {
    expect(follow(1, -0.4, 0.5)).toBe(-0.4);
  });
});

describe("clamp", () => {
  it("recorta por arriba y por abajo y respeta lo que está dentro", () => {
    expect(clamp(5, 0, 1)).toBe(1);
    expect(clamp(-5, 0, 1)).toBe(0);
    expect(clamp(0.5, 0, 1)).toBe(0.5);
  });
});
