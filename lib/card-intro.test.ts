import { describe, expect, it } from "vitest";
import { entryOffsetY, INTRO_SWAY_END, introSway } from "./card-intro";

/** Instants spread across the whole sway window, from outside to outside. */
const samples = (from: number, to: number, step = 0.01) => {
  const times: number[] = [];
  for (let t = from; t <= to; t += step) times.push(Number(t.toFixed(4)));
  return times;
};

/** Speed of the sway at an instant, measured on both sides. */
const speedAt = (t: number, step = 0.005) =>
  (introSway(t + step).x - introSway(t - step).x) / (2 * step);

describe("entryOffsetY", () => {
  it("leaves the whole card above the edge of the view", () => {
    // What is visible from the top edge upwards: if the bottom edge of the
    // card does not clear it, the fall starts half peeking in.
    for (const [viewHalf, cardHalf] of [
      [1.5, 1],
      [1.5, 0.2],
      [4, 1.1],
    ]) {
      expect(entryOffsetY(viewHalf, cardHalf) - cardHalf).toBeGreaterThan(viewHalf);
    }
  });

  it("raises the starting point when the screen or the card grow", () => {
    expect(entryOffsetY(2, 1)).toBeGreaterThan(entryOffsetY(1, 1));
    expect(entryOffsetY(1, 2)).toBeGreaterThan(entryOffsetY(1, 1));
  });
});

describe("introSway", () => {
  it("is still before it starts and after it ends", () => {
    for (const t of [-1, 0, 0.5, INTRO_SWAY_END, INTRO_SWAY_END + 5]) {
      expect(introSway(t)).toEqual({ x: 0, roll: 0 });
    }
  });

  it("goes there and back, and ends where it started", () => {
    const positions = samples(0, INTRO_SWAY_END).map((t) => introSway(t).x);
    expect(Math.max(...positions)).toBeGreaterThan(0.5);
    expect(Math.min(...positions)).toBeLessThan(-0.5);
  });

  it("does not leave the travel it is given", () => {
    for (const t of samples(0, INTRO_SWAY_END)) {
      const { x, roll } = introSway(t);
      expect(Math.abs(x)).toBeLessThanOrEqual(1);
      // An accompanying sway: above this the card tips over.
      expect(Math.abs(roll)).toBeLessThanOrEqual(0.25);
    }
  });

  it("enters and leaves without a jolt", () => {
    // The sway is cut mid-oscillation, so without the bell that wraps it the
    // displacement (and above all the tilt, which runs ahead) would snap to
    // zero at the edges.
    const step = 0.001;
    for (const t of [step, INTRO_SWAY_END - step]) {
      const { x, roll } = introSway(t);
      expect(Math.abs(x)).toBeLessThan(0.01);
      expect(Math.abs(roll)).toBeLessThan(0.001);
    }
  });

  it("tilts the card against the direction of travel", () => {
    // Where the sway is moving fast, the card lags behind: that is what
    // makes it look like something is pulling it rather than sliding it on
    // its edge.
    const times = samples(0, INTRO_SWAY_END);
    const speeds = new Map(times.map((t) => [t, speedAt(t)]));
    const fastest = Math.max(...[...speeds.values()].map(Math.abs));

    for (const [t, speed] of speeds) {
      if (Math.abs(speed) < fastest * 0.5) continue;
      expect(Math.sign(introSway(t).roll)).toBe(-Math.sign(speed));
    }
  });

  it("straightens the card at the ends of the travel", () => {
    // There the sway stops to come back, and a stopped card does not tilt:
    // the tilt runs a quarter of an oscillation ahead of the travel.
    const times = samples(0, INTRO_SWAY_END);
    const tilts = times.map((t) => Math.abs(introSway(t).roll));
    const atReach = times.reduce((furthest, t) =>
      Math.abs(introSway(t).x) > Math.abs(introSway(furthest).x) ? t : furthest,
    );

    expect(Math.abs(introSway(atReach).roll)).toBeLessThan(Math.max(...tilts) * 0.25);
  });
});
