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
      // El texto del enlace, y no solo la dirección en algún sitio del marcado:
      // el `aria-label` la lleva también, así que buscarla suelta pasaría igual
      // aunque en pantalla se leyera otra cosa. Y es justo la mitad del trato de
      // WCAG 2.5.3 que sostiene ese `aria-label`: si lo visible cambia y la
      // etiqueta no, el enlace deja de poder pulsarse por voz.
      expect(html).toContain(`>${profile.address}</a>`);
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
