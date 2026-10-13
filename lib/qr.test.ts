import { describe, expect, it } from "vitest";
import { qrCode } from "./qr";

const URL = "https://card.1to1digital.solutions";

/** Reads a module back from the path: whether (x, y) is covered by a rectangle. */
function isDark({ size, path }: ReturnType<typeof qrCode>, x: number, y: number): boolean {
  const grid = Array.from({ length: size }, () => Array<boolean>(size).fill(false));
  for (const match of path.matchAll(/M(\d+) (\d+)h(\d+)v1h-\d+z/g)) {
    const [, sx, sy, run] = match.map(Number);
    for (let i = 0; i < run; i++) grid[sy][sx + i] = true;
  }
  return grid[y][x];
}

describe("qrCode", () => {
  it("is deterministic for the same text", () => {
    expect(qrCode(URL)).toEqual(qrCode(URL));
  });

  it("is a small symbol for the card's address", () => {
    // Version 1 is 21 modules; the address needs a few more, but not many:
    // a dense code is harder for a camera to lock on to.
    const { size } = qrCode(URL);
    expect(size).toBeGreaterThanOrEqual(21);
    expect(size).toBeLessThanOrEqual(33);
  });

  it("has the three finder patterns in their corners", () => {
    const code = qrCode(URL);
    const last = code.size - 1;
    // The outer ring of each finder is dark and the ring inside it is light.
    for (const [cx, cy] of [
      [3, 3],
      [last - 3, 3],
      [3, last - 3],
    ]) {
      expect(isDark(code, cx - 3, cy - 3)).toBe(true);
      expect(isDark(code, cx - 2, cy - 2)).toBe(false);
      expect(isDark(code, cx, cy)).toBe(true);
    }
  });

  it("merges runs of dark modules into one rectangle each", () => {
    const { path } = qrCode(URL);
    // The top edge of the first finder is seven modules in one stroke.
    expect(path.startsWith("M0 0h7v1h-7z")).toBe(true);
    expect(path).not.toContain("h1v1h-1zM1 0");
  });
});
