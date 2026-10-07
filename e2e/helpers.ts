import type { Page } from "@playwright/test";

/** The contact details as a visitor sees them; the same values `lib/contact.ts` holds. */
export const CONTACT = {
  name: "César Peón Lamparero",
  company: "1to1 Digital Solutions",
  email: "cesarpl@1to1digital.solutions",
  website: "1to1digital.solutions",
};

/** The cookie the language toggle writes, read by the server before rendering. */
export const LANGUAGE_COOKIE = "contact-card-language";

/**
 * Makes WebGL unavailable before any script runs, so the page takes the
 * flat-card branch. `getContext` is the probe the page uses; the 2D context
 * stays, since the flat card does not need it either way.
 */
export async function disableWebgl(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...rest: unknown[]
    ) {
      if (type === "webgl" || type === "webgl2" || type === "experimental-webgl") return null;
      return (original as (this: HTMLCanvasElement, ...args: unknown[]) => unknown).call(
        this,
        type,
        ...rest,
      );
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
}
