import { describe, expect, it } from "vitest";
import { PROFILES, TRANSLATED } from "./contact";
import { DICTIONARIES, dictionary } from "./dictionary";
import { DEFAULT_LANGUAGE, LANGUAGES } from "./i18n";

/**
 * The `Dictionary` type already forces both languages to have the same keys;
 * what the compiler cannot check is that they are *translated*. Copying the
 * Spanish into the English to "fill it in" compiles just as well, and on
 * screen it shows a half-done card.
 */

/** Sample strings the texts with a slot are resolved with. */
const ARGS = ["Name", "Company"];

/** Flattens the dictionary to `nested.key` → text, resolving the functions. */
function flatten(value: unknown, path = ""): Map<string, string> {
  const flat = new Map<string, string>();
  if (typeof value === "string") {
    flat.set(path, value);
  } else if (typeof value === "function") {
    flat.set(path, (value as (...args: string[]) => string)(...ARGS));
  } else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      for (const [k, v] of flatten(child, path ? `${path}.${key}` : key)) {
        flat.set(k, v);
      }
    }
  }
  return flat;
}

/**
 * The only thing written the same in both languages. Any other match is a
 * missing translation.
 */
const SHARED = new Set(["fields.email"]);

const flat = new Map(LANGUAGES.map((language) => [language, flatten(dictionary(language))]));
const spanish = flat.get("es")!;

describe("dictionaries", () => {
  it("covers the languages that are served, and only those", () => {
    expect(Object.keys(DICTIONARIES).sort()).toEqual([...LANGUAGES].sort());
  });

  it.each(LANGUAGES)("has in %s the same keys as in Spanish", (language) => {
    expect([...flat.get(language)!.keys()].sort()).toEqual([...spanish.keys()].sort());
  });

  it.each(LANGUAGES)("leaves no text empty in %s", (language) => {
    for (const [key, text] of flat.get(language)!) {
      expect(text.trim(), `${language}.${key}`).not.toBe("");
    }
  });

  it.each(LANGUAGES.filter((language) => language !== "es"))(
    "translates into %s everything that is not written the same",
    (language) => {
      const copied = [...flat.get(language)!]
        .filter(([key, text]) => !SHARED.has(key) && text === spanish.get(key))
        .map(([key]) => key);

      expect(copied).toEqual([]);
    },
  );

  /**
   * The short hint exists to fit on one line on a phone: with `text-sm`
   * (14 px) and 24 px of margin on each side, about 46 characters fit on a
   * 375 px screen. Some slack is left under that number; if it goes over, it
   * eats two lines again and with them the card's room.
   */
  const SHORT_HINT_LIMIT = 44;

  it.each(LANGUAGES)("says the hint briefly for the phone in %s", (language) => {
    const { hint, hintShort, hintMotion } = dictionary(language).scene;
    for (const short of [hintShort, hintMotion]) {
      expect(short.length).toBeLessThanOrEqual(SHORT_HINT_LIMIT);
      expect(short.length).toBeLessThan(hint.length);
    }
  });

  it.each(LANGUAGES)(
    "can label the switch with its visible text in %s",
    (language) => {
      // A control's accessible name has to contain its visible text so it
      // can be activated by voice (WCAG 2.5.3): the switch shows "EN" and
      // announces "Switch to English".
      const { code, switchTo } = dictionary(language).language;
      expect(switchTo.toLowerCase()).toContain(code.toLowerCase());
    },
  );

  it.each(LANGUAGES)(
    "names each profile's link without losing what is visible in %s",
    (language) => {
      // Same rule as for the switch (WCAG 2.5.3): the link's accessible name
      // has to contain the visible text, which here is the address.
      for (const { name, address } of PROFILES) {
        const label = dictionary(language).panel.profile(name, address);
        expect(label).toContain(address);
        expect(label).toContain(name);
      }
    },
  );
});

/**
 * The profile texts (the job title, the tagline and what the business does)
 * live in `lib/contact.ts` and not in the dictionary, but they run the same
 * risk: that one is left untranslated or copied from the Spanish. They are
 * all iterated instead of named one by one so that the next one joins on its
 * own.
 */
describe("profile texts", () => {
  const entries = Object.entries(TRANSLATED);

  it("covers the ones there are, which are the ones `contactIn` resolves", () => {
    expect(entries.map(([key]) => key)).toEqual(["jobTitle", "tagline", "services"]);
  });

  it.each(entries)("writes %s in every language, and in each one its own", (key, byLanguage) => {
    expect(Object.keys(byLanguage).sort()).toEqual([...LANGUAGES].sort());
    expect(new Set(Object.values(byLanguage)).size, key).toBe(LANGUAGES.length);
    for (const text of Object.values(byLanguage)) expect(text.trim()).not.toBe("");
  });

  it("comes out in Spanish when the browser asks for nothing", () => {
    expect(TRANSLATED.jobTitle[DEFAULT_LANGUAGE]).toBe("Desarrollador full-stack");
    expect(TRANSLATED.services[DEFAULT_LANGUAGE]).toBe(
      "Desarrollo de software personalizado",
    );
  });

  /**
   * The tagline is printed on one line of the card, and there is no reflow
   * there: if it grows, it runs off the paper. The limit comes from the font
   * size it is drawn with (38 px over 2048 of width, with 150 of margin on
   * each side), leaving a third of slack for wide fonts.
   */
  it.each(LANGUAGES)("says the tagline in one card line in %s", (language) => {
    expect(TRANSLATED.tagline[language].length).toBeLessThanOrEqual(70);
  });
});
