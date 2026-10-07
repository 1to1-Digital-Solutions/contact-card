import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { PHONE_LANDSCAPE } from "./use-media-query";

/**
 * Splitting the screen on a phone in landscape is done by two at once: the
 * CSS moves the controls and hides the title, and the scene gives the card
 * its size. If each uses a different cutoff there is a stretch where the card
 * grows large with the controls still in the middle, or the other way round.
 */

const CSS = readFileSync(fileURLToPath(new URL("../app/globals.css", import.meta.url)), "utf8");

describe("phone landscape query", () => {
  it("is the same in the scene as in the Tailwind variant", () => {
    const variant = CSS.match(/@custom-variant phone-landscape \(@media ([\s\S]*?)\);/)?.[1];
    expect(variant).toBe(PHONE_LANDSCAPE);
  });

  it("stays below the width of the fixed panel", () => {
    // From `lg` up the data goes in a column alongside and the scene no
    // longer has the whole screen: there this mode has no business.
    expect(PHONE_LANDSCAPE).toContain("max-width");
  });

  /**
   * It is already written twice (here and in the scene) and that is what this
   * file watches. A third hand-written copy inside the CSS itself —for a rule
   * that cannot be expressed as a utility— would drift out of sync without
   * anyone noticing: that is what `@variant phone-landscape` is for.
   */
  it("is not written by hand a second time in the CSS", () => {
    const written = CSS.match(/\(orientation: landscape\)/g) ?? [];
    expect(written).toHaveLength(1);
  });
});

/**
 * In landscape the sheet hangs from the right edge, and a sheet that hangs
 * from the right has to enter from the right: the vertical slide would bring
 * it up from below to a place where it already is.
 */
describe("data sheet entrance", () => {
  /** The body of the block `marker` opens, with its braces balanced. */
  const blockAt = (marker: string) => {
    const start = CSS.indexOf(marker);
    if (start < 0) return "";
    const from = CSS.indexOf("{", start);
    let depth = 0;
    for (let i = from; i < CSS.length; i += 1) {
      if (CSS[i] === "{") depth += 1;
      if (CSS[i] === "}") {
        depth -= 1;
        if (depth === 0) return CSS.slice(from + 1, i);
      }
    }
    return "";
  };

  const landscapeRules = () => blockAt("@variant phone-landscape");

  it("moves along the X axis in landscape and along Y elsewhere", () => {
    const landscape = landscapeRules();
    expect(landscape).toContain("translate: 100% 0");
    expect(landscape).not.toContain("translate: 0 100%");
    // The usual stays outside the variant: the bottom sheet is left alone.
    expect(CSS.replace(landscape, "")).toContain("translate: 0 100%");
  });

  it("only moves for those who have not asked for less motion", () => {
    // The whole slide —both axes— hangs from that preference: whoever asks
    // for less motion gets the fade, which displaces nothing. What is checked
    // is that the variant is INSIDE that block, not that it shows up further
    // down the file: pulling it out would leave it just as far down and it
    // would no longer hang from it.
    const reduced = blockAt("@media (prefers-reduced-motion: no-preference)");
    expect(reduced).toContain("@variant phone-landscape");
    expect(reduced).toContain("translate: 100% 0");
  });
});
