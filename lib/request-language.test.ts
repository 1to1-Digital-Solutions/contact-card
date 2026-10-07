import { describe, expect, it, vi } from "vitest";
import { DEFAULT_LANGUAGE, LANGUAGE_COOKIE } from "./i18n";
import { requestLanguage } from "./request-language";

/**
 * `pickLanguage` is already tested thoroughly with real headers; what is left
 * to check is the wiring, which is where a failure goes unseen: if the header
 * name or the cookie name were misspelled, `get` would return `null` without
 * complaint and the page would come out in Spanish for everyone —exactly what
 * this task came to fix— with every other test green.
 */

const { cookies, headers } = vi.hoisted(() => ({ cookies: vi.fn(), headers: vi.fn() }));
vi.mock("next/headers", () => ({ cookies, headers }));

/** A request with the headers and the language cookie it is given. */
function request({ header, cookie }: { header?: string; cookie?: string } = {}) {
  headers.mockResolvedValue(new Headers(header ? { "Accept-Language": header } : {}));
  cookies.mockResolvedValue({
    get: (name: string) =>
      cookie !== undefined && name === LANGUAGE_COOKIE ? { name, value: cookie } : undefined,
  });
}

describe("requestLanguage", () => {
  it("serves the language the browser header asks for", async () => {
    request({ header: "en-GB,en;q=0.9,es;q=0.8" });
    await expect(requestLanguage()).resolves.toBe("en");
  });

  it("falls back to the fallback language when the request carries no header", async () => {
    request();
    await expect(requestLanguage()).resolves.toBe(DEFAULT_LANGUAGE);
  });

  it("falls back to the fallback language when it asks for one we do not serve", async () => {
    request({ header: "ja-JP,ja;q=0.9" });
    await expect(requestLanguage()).resolves.toBe(DEFAULT_LANGUAGE);
  });

  /**
   * The switcher's choice is more explicit than the header: whoever pressed
   * the button said which language they want the card in and the browser only
   * says which ones they can read. If the header won, the choice would last
   * as long as the visit, which is exactly what there was before remembering
   * it.
   */
  it("serves the remembered language even when the browser asks for the other", async () => {
    request({ header: "es-ES,es;q=0.9", cookie: "en" });
    await expect(requestLanguage()).resolves.toBe("en");

    request({ header: "en-US,en;q=0.9", cookie: "es" });
    await expect(requestLanguage()).resolves.toBe("es");
  });

  it("serves the remembered language when the request carries no header", async () => {
    request({ cookie: "en" });
    await expect(requestLanguage()).resolves.toBe("en");
  });

  /**
   * Anyone can write a cookie: another page on the domain, an extension or
   * the console itself. Without validation, a made-up value would slip all the
   * way into the dictionary and leave the page without texts.
   */
  it.each(["", "de", "es-ES", "EN", "null", "<script>"])(
    "ignores the cookie with a value we do not serve (%s) and negotiates with the header",
    async (cookie) => {
      request({ header: "en-GB,en;q=0.9", cookie });
      await expect(requestLanguage()).resolves.toBe("en");
    },
  );
});
