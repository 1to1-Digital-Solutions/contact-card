import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { contactIn, PROFILES } from "@/lib/contact";
import { LANGUAGES } from "@/lib/i18n";
import { CardFallback } from "./card-fallback";

/**
 * The flat card is what someone without WebGL sees, and it is the only one of
 * the two faces that can be read without opening a browser: the 3D one is
 * drawn on a canvas. What is checked here is that it says the same as that
 * one, so it does not fall behind when the front changes.
 */
describe("flat card", () => {
  const markup = (language: (typeof LANGUAGES)[number]) =>
    renderToStaticMarkup(<CardFallback note="" language={language} />);

  it("carries the LinkedIn profile with the other ways to reach them", () => {
    expect(markup("es")).toContain(PROFILES[0].address);
  });

  it.each(LANGUAGES)("still introduces whoever signs the card in %s", (language) => {
    const html = markup(language);
    const contact = contactIn(language);
    expect(html).toContain(contact.name);
    expect(html).toContain(contact.jobTitle);
    expect(html).toContain(contact.company);
  });

  /**
   * The tagline is the one line on the card that says what the company
   * stands for; what the business does is listed in the panel, not here.
   */
  it.each(LANGUAGES)("carries the tagline and not the services line in %s", (language) => {
    const html = markup(language);
    expect(html).toContain(contactIn(language).tagline);
    expect(html).not.toContain(contactIn(language).services);
  });
});
