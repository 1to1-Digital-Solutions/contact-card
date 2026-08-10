import { describe, expect, it } from "vitest";
import { CONTACT } from "./contact";
import { dictionary } from "./dictionary";
import { LANGUAGES, OG_LOCALE } from "./i18n";
import { buildMetadata } from "./metadata";

/**
 * Los metadatos son lo que se lee al compartir el enlace, y son lo único de la
 * página que no se ve al abrirla: si el idioma no llega hasta aquí, la tarjeta
 * sale en inglés y el mensaje que la anuncia, en español.
 */
describe("buildMetadata", () => {
  it.each(LANGUAGES)("declara en %s el `locale` de ese idioma", (language) => {
    expect(buildMetadata(language).openGraph).toMatchObject({
      locale: OG_LOCALE[language],
    });
  });

  it.each(LANGUAGES)("anuncia en %s que existe la otra versión", (language) => {
    const others = LANGUAGES.filter((other) => other !== language).map(
      (other) => OG_LOCALE[other],
    );
    expect(buildMetadata(language).openGraph).toMatchObject({
      alternateLocale: others,
    });
  });

  it.each(LANGUAGES)("titula y describe la página en %s", (language) => {
    const t = dictionary(language);
    const metadata = buildMetadata(language);

    expect(metadata.title).toBe(t.meta.title(CONTACT.name));
    expect(metadata.description).toBe(
      t.meta.description(CONTACT.name, CONTACT.company),
    );
  });

  it("repite el mismo título en Open Graph y en Twitter/X", () => {
    for (const language of LANGUAGES) {
      const { title, description, openGraph, twitter } = buildMetadata(language);
      expect(openGraph).toMatchObject({ title, description });
      expect(twitter).toMatchObject({ title, description });
    }
  });

  it("mantiene una sola URL canónica: el idioma se negocia, no se enruta", () => {
    for (const language of LANGUAGES) {
      const metadata = buildMetadata(language);
      expect(metadata.alternates?.canonical).toBe("/");
      expect(metadata.openGraph).toMatchObject({ url: "/" });
      expect(metadata.alternates?.languages).toBeUndefined();
    }
  });
});
