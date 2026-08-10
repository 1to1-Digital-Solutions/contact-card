import { cookies, headers } from "next/headers";
import { LANGUAGE_COOKIE, type Language, parseLanguage, pickLanguage } from "./i18n";

/**
 * El idioma de esta petición: el que se eligió en el conmutador si hay
 * elección guardada y, si no, el que negocia el navegador.
 *
 * La preferencia manda sobre la cabecera porque es más explícita: quien pulsó
 * el botón dijo en qué idioma quiere la tarjeta, y el navegador solo dice en
 * cuáles sabe leer. Si la cookie trae cualquier otra cosa se ignora y se
 * negocia como siempre.
 *
 * Leer una cabecera saca la página del prerenderizado: `/` pasa a renderizarse
 * en cada visita. Es el precio mínimo de acertar con el idioma en el primer
 * HTML —un fichero estático no puede negociar, ni leer una cookie— y solo lo
 * paga esa ruta: la imagen de compartir, `robots.txt` y el sitemap se siguen
 * generando en build.
 *
 * Vive aparte de `lib/i18n.ts` porque `next/headers` solo existe en el
 * servidor y ese módulo lo importan también los componentes de cliente.
 */
export async function requestLanguage(): Promise<Language> {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);

  return (
    parseLanguage(cookieStore.get(LANGUAGE_COOKIE)?.value) ??
    pickLanguage(headerList.get("accept-language"))
  );
}
