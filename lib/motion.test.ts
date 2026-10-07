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

/** Simulates `seconds` seconds at 60 fps and returns the final state. */
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
  it("converges to the target and comes to rest", () => {
    const final = simulate({ value: 0, velocity: 0 }, 5, 3);
    expect(final.value).toBeCloseTo(5, 3);
    expect(Math.abs(final.velocity)).toBeLessThan(0.01);
  });

  it("moves towards the target from the very first step", () => {
    const after = stepSpring({ value: 0, velocity: 0 }, 1, CONFIG, 1 / 60);
    expect(after.value).toBeGreaterThan(0);
    expect(after.value).toBeLessThan(1);
  });

  it("works the same with the target below the current value", () => {
    const final = simulate({ value: 10, velocity: 0 }, -2, 3);
    expect(final.value).toBeCloseTo(-2, 3);
  });

  it("does not diverge with a large delta (background tab)", () => {
    // Without subdividing the integration step, this delta blows Euler up.
    const after = stepSpring({ value: 0, velocity: 0 }, 1, CONFIG, 0.5);
    expect(Number.isFinite(after.value)).toBe(true);
    expect(Math.abs(after.value)).toBeLessThan(2);
  });

  it("keeps the initial energy: an incoming velocity overshoots the target", () => {
    const soft: SpringConfig = { stiffness: 120, damping: 6 };
    const after = stepSpring({ value: 0, velocity: 20 }, 0, soft, 1 / 60);
    expect(after.value).toBeGreaterThan(0);
  });

  it("takes longer to arrive with more damping", () => {
    const loose = simulate({ value: 0, velocity: 0 }, 1, 0.2, {
      stiffness: 180,
      damping: 12,
    });
    const stiff = simulate({ value: 0, velocity: 0 }, 1, 0.2, {
      stiffness: 180,
      damping: 60,
    });
    expect(loose.value).toBeGreaterThan(stiff.value);
  });

  it("ignores zero or negative deltas", () => {
    const state = { value: 3, velocity: 1 };
    expect(stepSpring(state, 0, CONFIG, 0)).toBe(state);
    expect(stepSpring(state, 0, CONFIG, -1)).toBe(state);
  });

  it("mass slows the response down", () => {
    const light = simulate({ value: 0, velocity: 0 }, 1, 0.15, {
      ...CONFIG,
      mass: 1,
    });
    const heavy = simulate({ value: 0, velocity: 0 }, 1, 0.15, {
      ...CONFIG,
      mass: 4,
    });
    expect(heavy.value).toBeLessThan(light.value);
  });
});

describe("smoothTowards", () => {
  const SMOOTH: SmoothConfig = { halfLife: 0.04, rest: 0.0005 };
  const FRAME = 1 / 60;

  /** Smooths `seconds` seconds at 60 fps towards a target that does not move. */
  function follow(from: number, target: number, seconds: number, config = SMOOTH) {
    let value = from;
    for (let t = 0; t < seconds; t += FRAME) {
      value = smoothTowards(value, target, config, FRAME);
    }
    return value;
  }

  it("covers half of what is left in each half-life", () => {
    expect(smoothTowards(0, 1, SMOOTH, SMOOTH.halfLife)).toBeCloseTo(0.5, 6);
    expect(smoothTowards(0, 1, SMOOTH, SMOOTH.halfLife * 2)).toBeCloseTo(0.75, 6);
  });

  /**
   * The distances are in pointer coordinates, which is where the filter is
   * used: from -1 to 1, so 1 is half a screen and 2 the worst possible case.
   */
  it("snaps to the target instead of hovering near it", () => {
    // Without the rest threshold this would keep approaching without ever
    // arriving, and the card would keep moving —less and less— with the mouse
    // already still.
    expect(follow(0, 1, 0.5)).toBe(1);
  });

  it("stops promptly: half a second is enough for the longest distance", () => {
    expect(follow(1, -1, 0.5)).toBe(-1);
  });

  it("does not depend on the refresh rate", () => {
    // The same 200 ms in 12 steps (60 fps) and in 6 (30 fps) leave the signal
    // in the same place: someone at 30 fps sees the same gesture, not a slower
    // one.
    const over = (steps: number) => {
      let value = 0;
      for (let i = 0; i < steps; i++) value = smoothTowards(value, 1, SMOOTH, 0.2 / steps);
      return value;
    };
    expect(over(6)).toBeCloseTo(over(12), 6);
  });

  it("spreads the distance over time but swallows none of it", () => {
    // The turn adds up the smoothed pointer's advances frame by frame: if the
    // filter lost part of the way, the same gesture would turn less than
    // before.
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
   * The one above measures a still target. With a moving target the filter
   * lags behind and at every moment there is a piece left undelivered: at the
   * speed of a flick of the wrist that is ~0.17 pointer units, which in the
   * card's turn is more than 30°. That is why whoever adds up the advances
   * frame by frame —the turning gesture— has to collect that remainder on
   * release: what was delivered plus what is left is, exactly, everything that
   * moved.
   */
  it("lags behind a moving target and leaves a remainder undelivered", () => {
    /** Three pointer units per second: a mouse moving fast. */
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

  it("neither overshoots the target nor bounces, unlike the spring", () => {
    let value = 0;
    for (let i = 0; i < 60; i++) {
      const next = smoothTowards(value, 1, SMOOTH, FRAME);
      expect(next).toBeGreaterThanOrEqual(value);
      expect(next).toBeLessThanOrEqual(1);
      value = next;
    }
  });

  it("without a half-life lets the target through as is", () => {
    // This is what the finger and whoever asked for less motion get: the
    // unfiltered gesture, just as before this smoothing existed.
    const direct: SmoothConfig = { halfLife: 0, rest: 0 };
    expect(smoothTowards(0, 0.37, direct, FRAME)).toBe(0.37);
  });

  it("ignores zero or negative deltas", () => {
    expect(smoothTowards(3, 0, SMOOTH, 0)).toBe(3);
    expect(smoothTowards(3, 0, SMOOTH, -1)).toBe(3);
  });

  it("works the same approaching from above", () => {
    expect(follow(1, -0.4, 0.5)).toBe(-0.4);
  });
});

describe("clamp", () => {
  it("clips above and below and respects what is inside", () => {
    expect(clamp(5, 0, 1)).toBe(1);
    expect(clamp(-5, 0, 1)).toBe(0);
    expect(clamp(0.5, 0, 1)).toBe(0.5);
  });
});
