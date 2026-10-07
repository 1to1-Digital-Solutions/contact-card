import { describe, expect, it } from "vitest";
import { CARD } from "./brand";
import { cardScale, type Size } from "./card-layout";

/**
 * The visible space the scene sees, in world units. The height does not
 * depend on the screen: it comes from the camera angle (32° at a distance of
 * 5.2, as in `card-scene.tsx`), and the width from the window's aspect
 * ratio.
 */
const VIEW_HEIGHT = 2 * Math.tan((32 * Math.PI) / 360) * 5.2;

const view = (widthPx: number, heightPx: number): Size => ({
  width: (VIEW_HEIGHT * widthPx) / heightPx,
  height: VIEW_HEIGHT,
});

/** Reference screens, in CSS pixels. */
const PHONE = view(375, 812);
const PHONE_ROTATED = view(812, 375);
const DESKTOP = view(1440, 900);

/** Share of the space the card takes up at that scale, from 0 to 1. */
const fills = (scale: number, space: Size) => ({
  width: (CARD.width * scale) / space.width,
  height: (CARD.height * scale) / space.height,
});

describe("cardScale", () => {
  it.each([
    ["a phone held upright", PHONE, false],
    ["a phone held sideways", PHONE_ROTATED, true],
    ["a phone held sideways with the usual share", PHONE_ROTATED, false],
    ["a desktop", DESKTOP, false],
  ] as const)("keeps the card inside the screen on %s", (_, space, phone) => {
    const filled = fills(cardScale(space, CARD, phone), space);
    expect(filled.width).toBeLessThanOrEqual(1);
    expect(filled.height).toBeLessThanOrEqual(1);
  });

  it("on a phone held upright it widens almost to the edge", () => {
    // This is the case where width is the scarce resource: if the card
    // shares the space as on a desktop, it ends up a thumbnail.
    const filled = fills(cardScale(PHONE, CARD, false), PHONE);
    expect(filled.width).toBeGreaterThan(0.85);
  });

  it("on a phone held sideways it takes almost the full height", () => {
    // What landscape mode asks for: the card at full size, with the controls
    // floating on top. It also pins that the scale cap does not eat into the
    // size precisely here, where it has to come out biggest.
    const filled = fills(cardScale(PHONE_ROTATED, CARD, true), PHONE_ROTATED);
    expect(filled.height).toBeGreaterThan(0.8);
  });

  it("on a phone held sideways it grows relative to the usual share", () => {
    const large = cardScale(PHONE_ROTATED, CARD, true);
    const normal = cardScale(PHONE_ROTATED, CARD, false);
    expect(large).toBeGreaterThan(normal * 1.2);
  });

  it("does not shrink without end in a tiny window", () => {
    // A folded-phone window or a very narrow phone held upright: below a
    // certain size the card stops being readable and going on is not worth it.
    expect(cardScale(view(120, 800), CARD, false)).toBe(0.25);
  });

  it("does not shoot up on a very wide screen", () => {
    const filled = fills(cardScale(view(3440, 1440), CARD, false), view(3440, 1440));
    expect(filled.width).toBeLessThan(0.7);
    expect(filled.height).toBeLessThan(0.7);
  });
});
