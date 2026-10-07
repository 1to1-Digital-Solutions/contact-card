import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE,
  type Language,
  LANGUAGES,
  nextLanguage,
  parseLanguage,
  pickLanguage,
  rememberLanguage,
} from "./i18n";

/**
 * The `Accept-Language` header is the only thing that decides which language
 * the card arrives in, and it arrives only once: there is no second chance on
 * the client. Very different browsers write it —with regions, with weights,
 * with wildcards and sometimes badly—, so here it is tested with what they
 * really send.
 */
describe("pickLanguage", () => {
  it("serves the fallback language when there is no header", () => {
    expect(pickLanguage(null)).toBe(DEFAULT_LANGUAGE);
    expect(pickLanguage(undefined)).toBe(DEFAULT_LANGUAGE);
    expect(pickLanguage("")).toBe(DEFAULT_LANGUAGE);
  });

  it("serves the fallback language when none of ours is requested", () => {
    expect(pickLanguage("de-DE,de;q=0.9,it;q=0.8")).toBe("es");
  });

  it("understands a simple header, with or without region", () => {
    expect(pickLanguage("en")).toBe("en");
    expect(pickLanguage("en-GB")).toBe("en");
    expect(pickLanguage("es-419")).toBe("es");
  });

  it("ignores case and does not choke on whitespace", () => {
    expect(pickLanguage("EN-US, es;q=0.5")).toBe("en");
    expect(pickLanguage("  en  ")).toBe("en");
  });

  it("picks the served language with the highest weight, not the first in the list", () => {
    expect(pickLanguage("en;q=0.4,es;q=0.9")).toBe("es");
    expect(pickLanguage("es;q=0.3,en;q=0.8")).toBe("en");
  });

  it("skips the languages we do not serve even when they weigh more", () => {
    expect(pickLanguage("fr-FR,fr;q=0.9,en;q=0.8,es;q=0.7")).toBe("en");
  });

  it("on equal weight respects the order the browser put them in", () => {
    expect(pickLanguage("en,es")).toBe("en");
    expect(pickLanguage("es,en")).toBe("es");
    expect(pickLanguage("en;q=0.8,es;q=0.8")).toBe("en");
  });

  it("discards the language the browser rejects with `q=0`", () => {
    expect(pickLanguage("en;q=0")).toBe(DEFAULT_LANGUAGE);
    expect(pickLanguage("es;q=0,en;q=0.5")).toBe("en");
  });

  it("resolves the wildcard to the fallback language", () => {
    expect(pickLanguage("*")).toBe(DEFAULT_LANGUAGE);
    expect(pickLanguage("en;q=0.2,*;q=0.9")).toBe(DEFAULT_LANGUAGE);
  });

  it("discards entries whose weight is not a weight", () => {
    expect(pickLanguage("en;q=alto")).toBe(DEFAULT_LANGUAGE);
    expect(pickLanguage("en;q=2")).toBe(DEFAULT_LANGUAGE);
    expect(pickLanguage("en;q=-1,es;q=0.1")).toBe("es");
  });

  it("survives a broken header without leaving the page languageless", () => {
    expect(pickLanguage(",,;;,")).toBe(DEFAULT_LANGUAGE);
    expect(pickLanguage("=?!")).toBe(DEFAULT_LANGUAGE);
    // Garbage up front, but the legitimate request is still there.
    expect(pickLanguage(";;;,en;q=0.9")).toBe("en");
  });
});

/**
 * The other source of language: the preference the switcher left behind.
 * Unlike the header, falling back to the fallback language when the value is
 * unusable is not acceptable here —it would mask the negotiation with the
 * browser—, so what gets checked is that it tells "there is nothing" from
 * "asked for Spanish".
 */
describe("parseLanguage", () => {
  it("recognises the languages we serve", () => {
    expect(parseLanguage("es")).toBe("es");
    expect(parseLanguage("en")).toBe("en");
  });

  it("returns `null` when there is no stored preference", () => {
    expect(parseLanguage(null)).toBeNull();
    expect(parseLanguage(undefined)).toBeNull();
    expect(parseLanguage("")).toBeNull();
  });

  it("returns `null` for any other value, without falling back to the default", () => {
    // Neither a language we do not serve, nor one of ours with a region or in
    // upper case: this is not a header to negotiate, it is a value we wrote.
    for (const value of ["de", "es-ES", "EN", " es", "null", "<script>"]) {
      expect(parseLanguage(value)).toBeNull();
    }
  });
});

describe("rememberLanguage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** Fake document: just the cookie, which is the only thing that gets written. */
  function withDocument({ protocol = "https:" } = {}) {
    const document = { cookie: "" };
    vi.stubGlobal("document", document);
    vi.stubGlobal("location", { protocol });
    return document;
  }

  /** The cookie attributes, without the leading `name=value` pair. */
  function attributes(cookie: string) {
    return cookie.split(";").slice(1).map((part) => part.trim());
  }

  /**
   * The name and the value have to be exactly what the server expects: if they
   * drift apart, the choice gets written and nobody reads it.
   */
  it.each(LANGUAGES)("stores the chosen language (%s) where the server reads it", (language) => {
    const document = withDocument();
    rememberLanguage(language);

    expect(document.cookie.startsWith(`${LANGUAGE_COOKIE}=${language};`)).toBe(true);
    expect(parseLanguage(document.cookie.split(";")[0].split("=")[1])).toBe(language);
  });

  it("stores it for the whole site and for a year", () => {
    const document = withDocument();
    rememberLanguage("en");

    expect(attributes(document.cookie)).toContain("Path=/");
    expect(attributes(document.cookie)).toContain(`Max-Age=${60 * 60 * 24 * 365}`);
  });

  /** It is not sent to third parties: the preference has no reason to travel outside. */
  it("restricts it to the site itself", () => {
    const document = withDocument();
    rememberLanguage("en");

    expect(attributes(document.cookie)).toContain("SameSite=Lax");
  });

  /**
   * `Secure` in production, but not in development: over `http` the browser
   * silently drops the cookie and the preference would be lost exactly where
   * it is tested.
   */
  it.each([
    ["https:", true],
    ["http:", false],
  ])("only marks it `Secure` over HTTPS (%s)", (protocol, marked) => {
    const document = withDocument({ protocol });
    rememberLanguage("en");

    expect(attributes(document.cookie).includes("Secure")).toBe(marked);
  });

  /**
   * Where cookies are forbidden —a sandboxed `iframe`—, writing them throws.
   * That cannot take the click down with it: the language has already changed
   * on the page and the only thing lost is remembering it, just like the theme
   * when storage is blocked.
   */
  it("does not blow up if the browser forbids writing cookies", () => {
    vi.stubGlobal("location", { protocol: "https:" });
    vi.stubGlobal("document", {
      set cookie(_value: string) {
        throw new Error("The operation is insecure.");
      },
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(() => rememberLanguage("en")).not.toThrow();
    expect(warn).toHaveBeenCalled();

    warn.mockRestore();
  });
});

describe("nextLanguage", () => {
  it("goes through every language and wraps back to the start", () => {
    let language: Language = LANGUAGES[0];
    const visited: Language[] = [language];
    for (let step = 1; step < LANGUAGES.length; step++) {
      language = nextLanguage(language);
      visited.push(language);
    }

    expect(new Set(visited)).toEqual(new Set(LANGUAGES));
    expect(nextLanguage(language)).toBe(LANGUAGES[0]);
  });
});
