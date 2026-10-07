import { cookies, headers } from "next/headers";
import { LANGUAGE_COOKIE, type Language, parseLanguage, pickLanguage } from "./i18n";

/**
 * The language of this request: the one chosen with the switcher if there is
 * a stored choice and, if not, the one the browser negotiates.
 *
 * The preference wins over the header because it is more explicit: whoever
 * pressed the button said which language they want the card in, and the
 * browser only says which ones they can read. If the cookie carries anything
 * else it is ignored and negotiation proceeds as usual.
 *
 * Reading a header takes the page out of prerendering: `/` becomes rendered
 * on every visit. It is the minimum price for getting the language right in
 * the first HTML —a static file can neither negotiate nor read a cookie— and
 * only that route pays it: the share image, `robots.txt` and the sitemap are
 * still generated at build time.
 *
 * It lives apart from `lib/i18n.ts` because `next/headers` only exists on the
 * server and that module is imported by client components too.
 */
export async function requestLanguage(): Promise<Language> {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);

  return (
    parseLanguage(cookieStore.get(LANGUAGE_COOKIE)?.value) ??
    pickLanguage(headerList.get("accept-language"))
  );
}
