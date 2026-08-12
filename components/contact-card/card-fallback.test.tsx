import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { contactIn } from "@/lib/contact";
import { LANGUAGES } from "@/lib/i18n";
import { CardFallback } from "./card-fallback";

/**
 * La tarjeta plana es la que ve quien no tiene WebGL, y es la única de las dos
 * caras que se puede leer sin abrir un navegador: la de 3D se dibuja en un
 * canvas. Lo que se comprueba aquí es que dice lo mismo que aquella, para que
 * no se quede atrás cuando el anverso cambie.
 */
describe("tarjeta plana", () => {
  const markup = (language: (typeof LANGUAGES)[number]) =>
    renderToStaticMarkup(<CardFallback note="" language={language} />);

  it.each(LANGUAGES)("lleva el lema en el anverso en %s", (language) => {
    expect(markup(language)).toContain(contactIn(language).tagline);
  });

  it.each(LANGUAGES)("sigue presentando a quien firma la tarjeta en %s", (language) => {
    const html = markup(language);
    const contact = contactIn(language);
    expect(html).toContain(contact.name);
    expect(html).toContain(contact.jobTitle);
    expect(html).toContain(contact.company);
  });

  /** A qué se dedica es del panel: en la tarjeta está el lema y nada más. */
  it("no repite en la tarjeta la línea de servicios del panel", () => {
    expect(markup("es")).not.toContain(contactIn("es").services);
  });
});
