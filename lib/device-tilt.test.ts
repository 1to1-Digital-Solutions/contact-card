import { describe, expect, it } from "vitest";
import { TILT_REACH } from "./card-orientation";
import { screenAngles, stepDeviceTilt, type DeviceAngles, type TiltState } from "./device-tilt";

/** Replays a run of sensor readings, one every 16 ms. */
function play(
  seconds: number,
  angles: (t: number) => DeviceAngles,
  from: TiltState = null,
  start = 0,
) {
  let state = from;
  let tilt = { turn: 0, pitch: 0 };
  for (let time = start; time <= start + seconds * 1000; time += 16) {
    const step = stepDeviceTilt(state, { angles: angles((time - start) / 1000), time });
    state = step.state;
    tilt = step.tilt;
  }
  return { state, tilt };
}

/** The phone held in the hand, facing whoever holds it. */
const HELD: DeviceAngles = { beta: 42, gamma: 0 };

describe("screenAngles", () => {
  it("with the phone upright leaves the angles as they come", () => {
    expect(screenAngles({ beta: 30, gamma: -12 }, 0)).toEqual({ beta: 30, gamma: -12 });
  });

  it("with the phone sideways swaps the axes around", () => {
    // At 90° the right edge of the device points to the top of the screen:
    // what was pitch becomes roll and vice versa, with the sign of the turn.
    const left = screenAngles({ beta: 30, gamma: -12 }, 90);
    expect(left.beta).toBeCloseTo(12, 10);
    expect(left.gamma).toBeCloseTo(30, 10);

    const right = screenAngles({ beta: 30, gamma: -12 }, 270);
    expect(right.beta).toBeCloseTo(-12, 10);
    expect(right.gamma).toBeCloseTo(-30, 10);
  });

  it("with the phone upside down inverts both", () => {
    const angles = screenAngles({ beta: 30, gamma: -12 }, 180);
    expect(angles.beta).toBeCloseTo(-30, 10);
    expect(angles.gamma).toBeCloseTo(12, 10);
  });
});

describe("stepDeviceTilt", () => {
  it("moves nothing with the first reading", () => {
    // The starting pose is however the phone is held when the page opens:
    // on the sofa, in bed or on the table, the card comes out facing forward.
    const { tilt } = stepDeviceTilt(null, { angles: HELD, time: 0 });
    expect(tilt).toEqual({ turn: 0, pitch: 0 });
  });

  it("turns the card the opposite way to the phone", () => {
    // Tilting the phone to the right reveals the card's left side, as if it
    // were still behind the glass.
    const start = stepDeviceTilt(null, { angles: HELD, time: 0 }).state;
    const { tilt } = stepDeviceTilt(start, {
      angles: { beta: HELD.beta, gamma: 10 },
      time: 100,
    });
    expect(tilt.turn).toBeLessThan(0);
  });

  it("pitches the opposite way to the phone", () => {
    // Raising the top edge moves that same edge of the card away.
    const start = stepDeviceTilt(null, { angles: HELD, time: 0 }).state;
    const { tilt } = stepDeviceTilt(start, {
      angles: { beta: HELD.beta + 10, gamma: 0 },
      time: 100,
    });
    expect(tilt.pitch).toBeLessThan(0);
  });

  it("stays a peek however far the phone tilts", () => {
    // It is added to the spin the viewer asks for, so it cannot end up
    // showing them the edge of the card.
    const start = stepDeviceTilt(null, { angles: { beta: 0, gamma: 0 }, time: 0 }).state;
    const { tilt } = stepDeviceTilt(start, {
      angles: { beta: -80, gamma: 85 },
      time: 100,
    });
    expect(Math.abs(tilt.turn)).toBeCloseTo(TILT_REACH.turn, 10);
    expect(Math.abs(tilt.pitch)).toBeCloseTo(TILT_REACH.pitch, 10);
  });

  it("forgets the pose that is held", () => {
    // Looking at the phone while lying back cannot leave the card crooked
    // for the rest of the visit: the peek fades out on its own if nobody
    // moves anything.
    const { tilt } = play(8, (t) => ({ beta: t < 0.5 ? 0 : 25, gamma: 0 }));
    expect(Math.abs(tilt.pitch)).toBeLessThan(TILT_REACH.pitch / 10);
  });

  it("keeps responding after forgetting it", () => {
    const settled = play(8, () => ({ beta: 25, gamma: 0 })).state;
    const { tilt } = stepDeviceTilt(settled, {
      angles: { beta: 25, gamma: -15 },
      time: 8_016,
    });
    expect(tilt.turn).toBeGreaterThan(0);
  });

  it("does not flip the card when the phone passes through vertical", () => {
    // The pitch jumps from 180 to -180 there: subtracting naively, that jump
    // would read as a sudden half turn.
    const start = stepDeviceTilt(null, { angles: { beta: 179, gamma: 0 }, time: 0 }).state;
    const { tilt } = stepDeviceTilt(start, { angles: { beta: -179, gamma: 0 }, time: 100 });
    expect(Math.abs(tilt.pitch)).toBeLessThan(TILT_REACH.pitch / 5);
  });

  it("starts over after a sleeping tab", () => {
    // On return, the phone is wherever it is: measuring it against the pose
    // from a few minutes ago would give a peek at the cap without anyone
    // having moved anything.
    const start = stepDeviceTilt(null, { angles: HELD, time: 0 }).state;
    const { tilt } = stepDeviceTilt(start, {
      angles: { beta: 0, gamma: 60 },
      time: 120_000,
    });
    expect(tilt).toEqual({ turn: 0, pitch: 0 });
  });
});
