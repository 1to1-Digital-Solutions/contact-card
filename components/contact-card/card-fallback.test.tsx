import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { contactIn } from "@/lib/contact";
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

  it.each(LANGUAGES)("carries the tagline on the front in %s", (language) => {
    expect(markup(language)).toContain(contactIn(language).tagline);
  });

  it.each(LANGUAGES)("still introduces whoever signs the card in %s", (language) => {
    const html = markup(language);
    const contact = contactIn(language);
    expect(html).toContain(contact.name);
    expect(html).toContain(contact.jobTitle);
    expect(html).toContain(contact.company);
  });

  /** What they do belongs to the panel: the card has the tagline and nothing else. */
  it("does not repeat the panel's services line on the card", () => {
    expect(markup("es")).not.toContain(contactIn("es").services);
  });
});
