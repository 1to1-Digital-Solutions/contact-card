import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PROFILES } from "@/lib/contact";
import { dictionary } from "@/lib/dictionary";
import { LANGUAGES } from "@/lib/i18n";
import { ContactPanel } from "./contact-panel";

/**
 * Los perfiles son enlaces que salen del sitio, y de eso no se ve nada mirando
 * la pantalla: si se pierde el `rel` o la etiqueta del enlace, la página sigue
 * igual de bonita. Se comprueba sobre el marcado que sale, no sobre la lista
 * de datos, que es donde acaban de verdad.
 */
describe("panel de datos", () => {
  const markup = (language: (typeof LANGUAGES)[number]) =>
    renderToStaticMarkup(<ContactPanel language={language} />);

  it.each(LANGUAGES)("enlaza cada perfil a su dirección en %s", (language) => {
    const html = markup(language);
    for (const profile of PROFILES) {
      expect(html).toContain(`href="${profile.url}"`);
      expect(html).toContain(profile.address);
    }
  });

  it("no le cuenta a los perfiles de dónde viene quien pulsa", () => {
    const html = markup("es");
    expect(html.match(/rel="noreferrer"/g)).toHaveLength(PROFILES.length);
  });

  it.each(LANGUAGES)("nombra el enlace de cada perfil en %s", (language) => {
    const html = markup(language);
    for (const profile of PROFILES) {
      const label = dictionary(language).panel.profile(profile.name, profile.address);
      expect(html).toContain(`aria-label="${label}"`);
    }
  });

  /** Los datos de siempre no salen fuera: ese `rel` es solo de los perfiles. */
  it("deja el email, el teléfono y la web como estaban", () => {
    const html = markup("es");
    expect(html).toContain('href="mailto:cesarpl@1to1digital.solutions"');
    expect(html).toContain('href="tel:+34685399864"');
    expect(html).toContain('href="https://1to1digital.solutions"');
  });
});
