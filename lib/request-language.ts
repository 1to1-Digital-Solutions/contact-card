import { headers } from "next/headers";
import { type Language, pickLanguage } from "./i18n";

/**
 * El idioma de esta petición, negociado con el navegador.
 *
 * Leer una cabecera saca la página del prerenderizado: `/` pasa a renderizarse
 * en cada visita. Es el precio mínimo de acertar con el idioma en el primer
 * HTML —un fichero estático no puede negociar— y solo lo paga esa ruta: la
 * imagen de compartir, `robots.txt` y el sitemap se siguen generando en build.
 *
 * Vive aparte de `lib/i18n.ts` porque `next/headers` solo existe en el
 * servidor y ese módulo lo importan también los componentes de cliente.
 */
export async function requestLanguage(): Promise<Language> {
  return pickLanguage((await headers()).get("accept-language"));
}
