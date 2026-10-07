import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { contactIn, PROFILES } from "@/lib/contact";
import { dictionary } from "@/lib/dictionary";
import { LANGUAGES } from "@/lib/i18n";
import { ContactPanel } from "./contact-panel";

/**
 * The profiles are links that leave the site, and none of that shows when
 * looking at the screen: if the `rel` or the link's label is lost, the page
 * looks just as nice. It is checked on the markup that comes out, not on the
 * data list, which is where they really end up.
 */
describe("contact panel", () => {
  const markup = (language: (typeof LANGUAGES)[number]) =>
    renderToStaticMarkup(<ContactPanel language={language} />);

  it.each(LANGUAGES)("links each profile to its address in %s", (language) => {
    const html = markup(language);
    for (const profile of PROFILES) {
      expect(html).toContain(`href="${profile.url}"`);
      // The link's text, and not just the address somewhere in the markup:
      // the `aria-label` carries it too, so searching for it loose would pass
      // just the same even if the screen read something else. And it is
      // exactly the half of the WCAG 2.5.3 deal that holds up that
      // `aria-label`: if what is visible changes and the label does not, the
      // link can no longer be activated by voice.
      expect(html).toContain(`>${profile.address}</a>`);
    }
  });

  it("does not tell the profiles where whoever clicks comes from", () => {
    const html = markup("es");
    expect(html.match(/rel="noreferrer"/g)).toHaveLength(PROFILES.length);
  });

  it.each(LANGUAGES)("names each profile's link in %s", (language) => {
    const html = markup(language);
    for (const profile of PROFILES) {
      const label = dictionary(language).panel.profile(profile.name, profile.address);
      expect(html).toContain(`aria-label="${label}"`);
    }
  });

  /**
   * The panel is where someone looks to find out whether you are a fit, so
   * what they do is said here plainly and with its label, in both languages.
   * It is not on the card: there sits the tagline, which is something else.
   */
  it.each(LANGUAGES)("says what they do, with its label, in %s", (language) => {
    const html = markup(language);
    const { services } = contactIn(language);
    expect(html).toContain(services);
    expect(html).toContain(dictionary(language).fields.services);
  });

  /** The usual data does not leave the site: that `rel` is for the profiles only. */
  it("leaves the email, the phone and the website as they were", () => {
    const html = markup("es");
    expect(html).toContain('href="mailto:cesarpl@1to1digital.solutions"');
    expect(html).toContain('href="tel:+34685399864"');
    expect(html).toContain('href="https://1to1digital.solutions"');
  });
});
