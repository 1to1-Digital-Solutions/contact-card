import { describe, expect, it } from "vitest";
import { CARD_URL, resolveSiteUrl } from "./site";

describe("resolveSiteUrl", () => {
  it("uses the card's own address when no variable is defined", () => {
    expect(resolveSiteUrl(undefined)).toBe(CARD_URL);
    expect(resolveSiteUrl("")).toBe(CARD_URL);
  });

  it("keeps the origin and drops path, query and hash", () => {
    expect(resolveSiteUrl("https://preview.vercel.app/path?a=1#x")).toBe(
      "https://preview.vercel.app",
    );
  });

  it("falls back to the default if the variable is not a valid URL", () => {
    expect(resolveSiteUrl("not-a-url")).toBe(CARD_URL);
  });

  it("is a bare https origin, with no path to trip metadataBase", () => {
    expect(new URL(CARD_URL).origin).toBe(CARD_URL);
    expect(CARD_URL.startsWith("https://")).toBe(true);
  });
});
