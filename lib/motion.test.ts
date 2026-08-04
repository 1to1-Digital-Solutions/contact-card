import { describe, expect, it } from "vitest";
import { clamp, stepSpring, type SpringConfig, type SpringState } from "./motion";

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

describe("clamp", () => {
  it("recorta por arriba y por abajo y respeta lo que está dentro", () => {
    expect(clamp(5, 0, 1)).toBe(1);
    expect(clamp(-5, 0, 1)).toBe(0);
    expect(clamp(0.5, 0, 1)).toBe(0.5);
  });
});
