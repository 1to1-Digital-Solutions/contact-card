import { describe, expect, it } from "vitest";
import { contactIn, PROFILES, TRANSLATED } from "@/lib/contact";
import { LANGUAGES } from "@/lib/i18n";
import { personSchema } from "./json-ld";

/**
 * Structured data is what search engines and AI engines read, and it is not
 * seen on the page: if a field drops out or is misnamed, nobody notices. The
 * exact schema.org names are checked, which are the contract.
 */
describe("personSchema", () => {
  const schema = personSchema(contactIn("es"));

  it("describes a schema.org person", () => {
    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("Person");
  });

  it("declares the job title in `jobTitle`, which is the standard's property", () => {
    expect(schema.jobTitle).toBe("Desarrollador full-stack");
  });

  /**
   * The JSON-LD job title has to go in the language being served: the page
   * announces it in `<html lang>` and a profile saying otherwise would be
   * telling the search engine a language that is not the real one.
   */
  it.each(LANGUAGES)("declares the job title in the served language (%s)", (language) => {
    expect(personSchema(contactIn(language)).jobTitle).toBe(
      TRANSLATED.jobTitle[language],
    );
  });

  /**
   * `description` is where schema.org says what someone does, and it is what
   * an AI engine reads when asked about them. It is the services line, the
   * same one seen in the data panel: the tagline promises, but it does not
   * say what anyone does.
   */
  it("declares what they do in `description`", () => {
    expect(schema.description).toBe("Desarrollo de software personalizado");
  });

  it.each(LANGUAGES)("declares what they do in the served language (%s)", (language) => {
    expect(personSchema(contactIn(language)).description).toBe(
      TRANSLATED.services[language],
    );
  });

  /** The company does the same thing, and it also gets asked what it does. */
  it.each(LANGUAGES)("says what the company does (%s)", (language) => {
    expect(personSchema(contactIn(language)).worksFor.description).toBe(
      TRANSLATED.services[language],
    );
  });

  /**
   * `sameAs` is the property with which one says that the person in the
   * profile is also the one in those profiles. Without it, the page and
   * César's LinkedIn are two strangers to whoever reads it.
   */
  it("declares the public profiles in `sameAs`", () => {
    expect(schema.sameAs).toEqual(PROFILES.map((profile) => profile.url));
    expect(schema.sameAs.map((url) => new URL(url).host).sort()).toEqual([
      "github.com",
      "www.linkedin.com",
    ]);
  });
});
