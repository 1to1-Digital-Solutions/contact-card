import { describe, expect, it } from "vitest";
import { CONTACT } from "./contact";
import { dictionary } from "./dictionary";
import { LANGUAGES, OG_LOCALE } from "./i18n";
import { buildMetadata } from "./metadata";

/**
 * The metadata is what gets read when the link is shared, and it is the only
 * part of the page not seen when opening it: if the language does not reach
 * this far, the card comes out in English and the message announcing it, in
 * Spanish.
 */
describe("buildMetadata", () => {
  it.each(LANGUAGES)("declares in %s the `locale` of that language", (language) => {
    expect(buildMetadata(language).openGraph).toMatchObject({
      locale: OG_LOCALE[language],
    });
  });

  it.each(LANGUAGES)("announces in %s that the other version exists", (language) => {
    const others = LANGUAGES.filter((other) => other !== language).map(
      (other) => OG_LOCALE[other],
    );
    expect(buildMetadata(language).openGraph).toMatchObject({
      alternateLocale: others,
    });
  });

  it.each(LANGUAGES)("titles and describes the page in %s", (language) => {
    const t = dictionary(language);
    const metadata = buildMetadata(language);

    expect(metadata.title).toBe(t.meta.title(CONTACT.name));
    expect(metadata.description).toBe(
      t.meta.description(CONTACT.name, CONTACT.company),
    );
  });

  it("repeats the same title in Open Graph and in Twitter/X", () => {
    for (const language of LANGUAGES) {
      const { title, description, openGraph, twitter } = buildMetadata(language);
      expect(openGraph).toMatchObject({ title, description });
      expect(twitter).toMatchObject({ title, description });
    }
  });

  it("keeps a single canonical URL: the language is negotiated, not routed", () => {
    for (const language of LANGUAGES) {
      const metadata = buildMetadata(language);
      expect(metadata.alternates?.canonical).toBe("/");
      expect(metadata.openGraph).toMatchObject({ url: "/" });
      expect(metadata.alternates?.languages).toBeUndefined();
    }
  });
});
