import { describe, expect, it } from "vitest";
import { STILL, stepShake, type ShakeSample, type ShakeState } from "./shake";

/**
 * The shakes are fed to the detector the way the sensor would feed them: one
 * reading every 16 ms (60 per second, which is what a phone delivers) and with
 * gravity included, which is the bad case. What gets checked is the deal:
 * shaking flips the card, and carrying the phone around does not.
 */

const G = 9.81;
const STEP = 16;

/** Plays back a run of readings and returns when each shake was given. */
function play(
  seconds: number,
  acceleration: (t: number) => { x: number; y: number; z: number },
  from: ShakeState = STILL,
): { state: ShakeState; shakes: number[] } {
  let state = from;
  const shakes: number[] = [];
  for (let time = 0; time <= seconds * 1000; time += STEP) {
    const { x, y, z } = acceleration(time / 1000);
    const sample: ShakeSample = { x, y, z, time };
    const step = stepShake(state, sample);
    state = step.state;
    if (step.shaken) shakes.push(time);
  }
  return { state, shakes };
}

/** The phone in the hand, with gravity pulling down the screen. */
const held = () => ({ x: 0, y: -G, z: 0 });

/** Shaking it side to side: about four back-and-forths per second. */
const shaking = (amplitude: number) => (t: number) => ({
  x: amplitude * Math.sin(2 * Math.PI * 4 * t),
  y: -G,
  z: 0,
});

describe("stepShake", () => {
  it("does not flip the card with the phone still", () => {
    expect(play(5, held).shakes).toEqual([]);
  });

  it("does not flip it when turning the phone slowly", () => {
    // From vertical to horizontal in two seconds: gravity changes axis
    // entirely, and without the high-pass filter that would read as a jolt.
    const { shakes } = play(3, (t) => {
      const angle = (Math.min(t, 2) / 2) * (Math.PI / 2);
      return { x: G * Math.sin(angle), y: -G * Math.cos(angle), z: 0 };
    });
    expect(shakes).toEqual([]);
  });

  it("does not flip it with the rattle of walking fast", () => {
    // The phone in the hand going down stairs or in a car over cobblestones:
    // the rattle runs at the same frequency as a shake and is only told apart
    // from it by its strength. This is the case that sets the threshold: with
    // a lower one, the card would flip on the way to nowhere.
    const { shakes } = play(6, (t) => ({
      x: 6 * Math.sin(2 * Math.PI * 4 * t),
      y: -G + 2.5 * Math.sin(2 * Math.PI * 4 * t + 1),
      z: 1.5 * Math.sin(2 * Math.PI * 4 * t),
    }));
    expect(shakes).toEqual([]);
  });

  it("does not flip it with a single hit", () => {
    // Dropping the phone onto the table: a single jolt, and a strong one.
    const { shakes } = play(3, (t) => ({
      x: 0,
      y: -G + (t > 1 && t < 1.08 ? 25 : 0),
      z: 0,
    }));
    expect(shakes).toEqual([]);
  });

  it("flips it when shaken", () => {
    const { shakes } = play(2, shaking(18));
    expect(shakes.length).toBeGreaterThan(0);
    // Within a second: if it takes longer shaking, the gesture seems not to
    // work and gets abandoned.
    expect(shakes[0]).toBeLessThan(1000);
  });

  it("does not chain flips for as long as the shake lasts", () => {
    // Really shaking is several seconds in a row. The card has to flip once
    // per shake, not once per jolt.
    const { shakes } = play(5, shaking(18));
    expect(shakes.length).toBeLessThanOrEqual(5);
    for (let i = 1; i < shakes.length; i++) {
      expect(shakes[i] - shakes[i - 1]).toBeGreaterThanOrEqual(1000);
    }
  });

  it("responds again to the next shake", () => {
    // Shake, stop and shake again gives two flips: the rest does not leave
    // the shake deaf forever.
    const { shakes } = play(6, (t) =>
      t < 1.5 || t > 3.5 ? shaking(18)(t) : held(),
    );
    expect(shakes.length).toBeGreaterThanOrEqual(2);
    expect(shakes.at(-1)).toBeGreaterThan(3500);
  });

  it("does not count a jolt arriving from a sleeping tab", () => {
    // On coming back to the foreground, the first reading arrives minutes
    // after the previous one: the stored gravity is no longer good for
    // measuring anything.
    const still = play(1, held).state;
    const { shaken } = stepShake(still, { x: 30, y: 30, z: 30, time: 90_000 });
    expect(shaken).toBe(false);
  });

  it("does not make up a shake from the first reading", () => {
    // Gravity starts out at zero: without seeding it from the first reading,
    // those 9.81 would read as a jolt.
    expect(stepShake(STILL, { x: 0, y: -G, z: 0, time: 0 }).shaken).toBe(false);
  });
});
