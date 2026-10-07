import { describe, expect, it } from "vitest";
import {
  hasLeftView,
  isDoubleTap,
  isTap,
  readTap,
  type CardBox,
  type ViewBox,
} from "./card-gestures";

const mark = (x: number, y: number, time: number, pointerId = 1) => ({
  pointerId,
  x,
  y,
  time,
});

describe("isTap", () => {
  it("a short, still touch is a tap", () => {
    expect(isTap(mark(100, 100, 0), mark(102, 99, 90))).toBe(true);
  });

  it("a finger that stays resting is not a tap", () => {
    expect(isTap(mark(100, 100, 0), mark(100, 100, 600))).toBe(false);
  });

  it("a drag is not a tap, however quick it is", () => {
    expect(isTap(mark(100, 100, 0), mark(180, 100, 80))).toBe(false);
  });

  it("does not measure one finger against another", () => {
    // Two fingers together on the card: the second overwrites the mark of
    // the first, and when the first lifts the two ends belong to different
    // fingers.
    expect(isTap(mark(100, 100, 0, 2), mark(102, 99, 90, 1))).toBe(false);
  });
});

describe("readTap", () => {
  const previous = mark(100, 100, 0);

  it("the first tap only stays in the memory", () => {
    expect(readTap(mark(100, 100, 0), mark(101, 101, 80), null)).toEqual({
      flip: false,
      lastTap: mark(101, 101, 80),
    });
  });

  it("the second tap flips the card and clears the memory", () => {
    expect(readTap(mark(104, 102, 180), mark(105, 103, 240), previous)).toEqual({
      flip: true,
      lastTap: null,
    });
  });

  it("a third tap starts a new count instead of spinning again", () => {
    const { lastTap } = readTap(mark(104, 102, 180), mark(105, 103, 240), previous);
    expect(readTap(mark(104, 102, 400), mark(105, 103, 460), lastTap)).toEqual({
      flip: false,
      lastTap: mark(105, 103, 460),
    });
  });

  it("a drag does not count and leaves the memory as it was", () => {
    expect(readTap(mark(100, 100, 100), mark(300, 100, 400), previous)).toEqual({
      flip: false,
      lastTap: previous,
    });
  });

  it("the second delivery of the same release, now without a mark, does not spin again", () => {
    // The `pointerup` enters once per mesh the ray passes through: the
    // component consumes the mark, so the rest arrive without it.
    const up = mark(105, 103, 240);
    expect(readTap(mark(104, 102, 180), up, previous)).toEqual({
      flip: true,
      lastTap: null,
    });
    expect(readTap(null, up, null)).toEqual({ flip: false, lastTap: null });
  });
});

describe("isDoubleTap", () => {
  it("two taps in a row and in the same place are a double tap", () => {
    expect(isDoubleTap(mark(100, 100, 0), mark(108, 104, 180))).toBe(true);
  });

  it("without a previous tap there is no double tap", () => {
    expect(isDoubleTap(null, mark(100, 100, 180))).toBe(false);
  });

  it("tolerates a slow finger within the platforms' window", () => {
    expect(isDoubleTap(mark(100, 100, 0), mark(100, 100, 400))).toBe(true);
  });

  it("two taps far apart in time are two separate taps", () => {
    expect(isDoubleTap(mark(100, 100, 0), mark(100, 100, 900))).toBe(false);
  });

  it("two taps at the same time but at different points do not count", () => {
    expect(isDoubleTap(mark(100, 100, 0), mark(300, 100, 180))).toBe(false);
  });
});

describe("hasLeftView", () => {
  // The measurements of a phone held upright: the card takes up almost the
  // whole width of the view (90 %) and has height to spare on both sides.
  const card: CardBox = { x: 0, y: 0, halfWidth: 0.62, halfHeight: 0.4 };
  const view: ViewBox = { halfWidth: 0.69, halfHeight: 1.49 };

  it("at rest the card is inside", () => {
    expect(hasLeftView(card, view)).toBe(false);
  });

  it("peeking over the edge it is still inside", () => {
    expect(hasLeftView({ ...card, x: 0.8 }, view)).toBe(false);
    expect(hasLeftView({ ...card, y: -1.2 }, view)).toBe(false);
  });

  it("it has gone when less than a quarter of it remains", () => {
    // With the centre at 0.95, 29 % of its width is still visible; at 1.1, 17 %.
    expect(hasLeftView({ ...card, x: 0.95 }, view)).toBe(false);
    expect(hasLeftView({ ...card, x: 1.1 }, view)).toBe(true);
    expect(hasLeftView({ ...card, x: -1.1 }, view)).toBe(true);
  });

  it("it also leaves through the top and the bottom", () => {
    expect(hasLeftView({ ...card, y: 1.8 }, view)).toBe(true);
    expect(hasLeftView({ ...card, y: -1.8 }, view)).toBe(true);
  });

  it("a card wider than the view does not count as gone for being centred", () => {
    const wide: CardBox = { ...card, halfWidth: 2 };
    expect(hasLeftView(wide, view)).toBe(false);
    expect(hasLeftView({ ...wide, x: 2.4 }, view)).toBe(true);
  });

  it("with no view measured yet, the card is not deemed gone", () => {
    expect(hasLeftView(card, { halfWidth: 0, halfHeight: 0 })).toBe(false);
  });

  // The threshold has to stay within reach of the finger, which cannot push
  // the card past the edge of the screen: if it is grabbed `grip` away from
  // the centre, the centre of the card gets at most to `viewHalf + grip`.
  // That is where the deal comes from, and it does not depend on the screen
  // size: whoever grabs it by the outer half of its side sends it away.
  describe("within reach of the finger", () => {
    it("it goes if grabbed by the outer half of the side", () => {
      const grip = card.halfWidth * 0.6;
      expect(hasLeftView({ ...card, x: view.halfWidth + grip }, view)).toBe(true);

      const verticalGrip = card.halfHeight * 0.6;
      expect(
        hasLeftView({ ...card, y: -(view.halfHeight + verticalGrip) }, view),
      ).toBe(true);
    });

    it("it does not go if grabbed by the centre: half the card is still inside", () => {
      expect(hasLeftView({ ...card, x: view.halfWidth }, view)).toBe(false);
      expect(hasLeftView({ ...card, y: -view.halfHeight }, view)).toBe(false);
    });
  });
});
