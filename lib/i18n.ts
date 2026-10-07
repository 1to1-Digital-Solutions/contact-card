/**
 * The languages the card is served in and how one of them gets chosen.
 *
 * The choice is made on the server, from the `Accept-Language` header: the
 * language has to be right in the very first HTML. For the theme an inline
 * script that fixes a class before paint is enough; for the text there is no
 * equivalent, because the text is already written by the time the script runs.
 *
 * No i18n library on purpose: it is two languages and one screen, and all it
 * takes is negotiating the header and looking things up in an object.
 */

export const LANGUAGES = ["es", "en"] as const;

export type Language = (typeof LANGUAGES)[number];

/** Fallback language: the one served when the browser asks for neither of the two. */
export const DEFAULT_LANGUAGE: Language = "es";

/**
 * Where the language chosen with the switcher is remembered. It goes in a
 * cookie and not in browser storage because the one who has to read it is the
 * server, before writing the text: by the time a script ran it would be too
 * late. It is a functional preference —it identifies nobody and is shared with
 * nobody—, so it needs no consent.
 */
export const LANGUAGE_COOKIE = "contact-card-language";

/** The Open Graph `locale`, which carries a region and an underscore. */
export const OG_LOCALE: Record<Language, string> = {
  es: "es_ES",
  en: "en_US",
};

function isLanguage(value: string): value is Language {
  return (LANGUAGES as readonly string[]).includes(value);
}

/**
 * The language stored in a preference, or `null` if it is not one we serve.
 * It returns `null` instead of the fallback language on purpose: whoever reads
 * the preference has to be able to tell "asked for Spanish" from "there is
 * nothing usable here", so as to fall back to negotiating with the browser.
 */
export function parseLanguage(value: string | null | undefined): Language | null {
  return value && isLanguage(value) ? value : null;
}

/** The next language in the list, wrapping around: the one the switcher offers. */
export function nextLanguage(language: Language): Language {
  return LANGUAGES[(LANGUAGES.indexOf(language) + 1) % LANGUAGES.length];
}

type Preference = { language: Language; quality: number };

/**
 * The weight of an `Accept-Language` entry. It is 1 when absent, which is what
 * RFC 9110 §12.4.2 says. If it is present but not a number between 0 and 1, it
 * returns `null` so the entry is discarded: a malformed header must not slip
 * ahead of the ones that are well formed.
 */
function parseQuality(params: string[]): number | null {
  const param = params
    .map((value) => value.replace(/\s/g, "").toLowerCase())
    .find((value) => value.startsWith("q="));
  if (!param) return 1;

  const quality = Number(param.slice("q=".length));
  if (!Number.isFinite(quality) || quality < 0 || quality > 1) return null;
  return quality;
}

/**
 * One header entry (`es-ES;q=0.8`) turned into a preference, or `null` if it
 * does not count: a language we do not serve, a `q=0` —which is how the
 * browser rejects a language— or a malformed weight.
 */
function parsePreference(entry: string): Preference | null {
  const [rawTag, ...params] = entry.split(";");
  const tag = rawTag.trim().toLowerCase();
  if (!tag) return null;

  const quality = parseQuality(params);
  if (quality === null || quality === 0) return null;

  // `*` means "anything goes": it resolves to the fallback language.
  if (tag === "*") return { language: DEFAULT_LANGUAGE, quality };

  // `en-GB` and `en` ask for the same language: only the primary subtag counts.
  const primary = tag.split("-")[0];
  return isLanguage(primary) ? { language: primary, quality } : null;
}

/**
 * The language served for an `Accept-Language` header. If there is no header,
 * or none of its entries asks for a language we have, it falls back to the
 * fallback language.
 */
export function pickLanguage(acceptLanguage: string | null | undefined): Language {
  if (!acceptLanguage) return DEFAULT_LANGUAGE;

  const preferences = acceptLanguage
    .split(",")
    .map(parsePreference)
    .filter((preference): preference is Preference => preference !== null)
    // `sort` is stable, so on equal weight the entry the browser put first
    // wins, which is exactly the order it meant to express.
    .sort((a, b) => b.quality - a.quality);

  return preferences[0]?.language ?? DEFAULT_LANGUAGE;
}

/**
 * Leaves the chosen language on the document when the switcher changes it.
 * The `lang` of `<html>` is not decorative: it decides how a screen reader
 * pronounces the text and how the browser breaks it. The tab title was painted
 * on the server with the negotiated language, so it gets corrected too.
 */
export function applyLanguage(language: Language, title: string): void {
  document.documentElement.lang = language;
  document.title = title;
}

/** A year from the last press of the switcher, which is when it gets rewritten. */
const LANGUAGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Remembers for the next visits the language that has just been chosen.
 *
 * It is only written when the switcher is pressed, never with the negotiated
 * language: if that one were stored too, the browser header would stop
 * counting even if the visitor changed their system language.
 */
export function rememberLanguage(language: Language): void {
  try {
    // No `Secure` outside HTTPS: in development the cookie would never get
    // written and the preference would be lost exactly where it is tested.
    const secure = location.protocol === "https:" ? ";Secure" : "";
    document.cookie = `${LANGUAGE_COOKIE}=${language};Path=/;Max-Age=${LANGUAGE_COOKIE_MAX_AGE};SameSite=Lax${secure}`;
  } catch (error) {
    // As with the theme: the language changes on the page all the same, the
    // only thing lost is remembering it. Writing cookies throws where they are
    // forbidden —a sandboxed `iframe`, for instance—, and the switcher cannot
    // let that take the click down with it.
    console.warn("Could not remember the chosen language:", error);
  }
}
