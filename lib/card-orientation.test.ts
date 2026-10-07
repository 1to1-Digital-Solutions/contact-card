import { describe, expect, it } from "vitest";
import { isShowingBack, pointerTilt, snapToHalfTurn } from "./card-orientation";

const PI = Math.PI;

describe("snapToHalfTurn", () => {
  it("leaves angles that are already an exact half turn untouched", () => {
    expect(snapToHalfTurn(0)).toBe(0);
    expect(snapToHalfTurn(PI)).toBeCloseTo(PI, 10);
    expect(snapToHalfTurn(-2 * PI)).toBeCloseTo(-2 * PI, 10);
  });

  it("rounds to the nearest half turn", () => {
    expect(snapToHalfTurn(0.4 * PI)).toBeCloseTo(0, 10);
    expect(snapToHalfTurn(0.6 * PI)).toBeCloseTo(PI, 10);
    expect(snapToHalfTurn(2.9 * PI)).toBeCloseTo(3 * PI, 10);
  });

  it("rounds just as well when spinning to the left", () => {
    expect(snapToHalfTurn(-0.4 * PI)).toBeCloseTo(0, 10);
    expect(snapToHalfTurn(-0.6 * PI)).toBeCloseTo(-PI, 10);
    expect(snapToHalfTurn(-3.4 * PI)).toBeCloseTo(-3 * PI, 10);
  });
});

describe("isShowingBack", () => {
  it("with the card facing forward it shows the front", () => {
    expect(isShowingBack(0)).toBe(false);
    expect(isShowingBack(2 * PI)).toBe(false);
    expect(isShowingBack(-2 * PI)).toBe(false);
  });

  it("with a half turn it shows the back", () => {
    expect(isShowingBack(PI)).toBe(true);
    expect(isShowingBack(3 * PI)).toBe(true);
  });

  it("gets it right with spins to the left too", () => {
    expect(isShowingBack(-PI)).toBe(true);
    expect(isShowingBack(-3 * PI)).toBe(true);
    expect(isShowingBack(-4 * PI)).toBe(false);
  });

  it("half-way through a spin the face that shows most already counts as turned", () => {
    expect(isShowingBack(0.4 * PI)).toBe(false);
    expect(isShowingBack(0.6 * PI)).toBe(true);
  });
});

describe("pointerTilt", () => {
  it("with the pointer in the centre it leaves the card facing forward", () => {
    const { turn, pitch } = pointerTilt(0, 0);
    expect(turn).toBeCloseTo(0, 10);
    expect(pitch).toBeCloseTo(0, 10);
  });

  it("sinks the side the pointer passes over", () => {
    // A positive turn around the vertical axis moves the right edge away,
    // and a positive one around the horizontal axis brings the top edge
    // closer: with the pointer at the top right, that corner is the one
    // that recedes into the background.
    const { turn, pitch } = pointerTilt(1, 1);
    expect(turn).toBeGreaterThan(0);
    expect(pitch).toBeLessThan(0);
  });

  it("peeks the same amount towards the other side", () => {
    const right = pointerTilt(0.6, 0.3);
    const left = pointerTilt(-0.6, -0.3);
    expect(left.turn).toBeCloseTo(-right.turn, 10);
    expect(left.pitch).toBeCloseTo(-right.pitch, 10);
  });

  it("is a peek, not a spin", () => {
    // It is added to the spin the user asks for, so it has to stay a
    // gesture: if it grew, moving the mouse would be enough to end up
    // looking at the edge.
    const { turn, pitch } = pointerTilt(1, 1);
    expect(Math.abs(turn)).toBeLessThan(0.35);
    expect(Math.abs(pitch)).toBeLessThan(0.35);
  });

  it("does not overshoot with the pointer outside the canvas", () => {
    // The scene delivers coordinates beyond 1 while dragging with the
    // pointer captured outside the window.
    expect(pointerTilt(9, -4)).toEqual(pointerTilt(1, -1));
  });
});
