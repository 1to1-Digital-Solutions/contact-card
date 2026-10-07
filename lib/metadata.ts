import type { Metadata } from "next";
import { CONTACT } from "./contact";
import { dictionary } from "./dictionary";
import { type Language, LANGUAGES, OG_LOCALE } from "./i18n";
import { SITE_URL } from "./site";

/**
 * The page metadata in the language being served. It lives in `lib/` and not
 * in the layout so it can be checked without dragging in `next/headers`.
 *
 * There is no per-language URL to declare in `alternates.languages`: it is the
 * same page negotiated with the browser. What is stated is that the other
 * version exists, through `alternateLocale`.
 */
export function buildMetadata(language: Language): Metadata {
  const t = dictionary(language);
  const title = t.meta.title(CONTACT.name);
  const description = t.meta.description(CONTACT.name, CONTACT.company);

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: { canonical: "/" },
    openGraph: {
      type: "profile",
      locale: OG_LOCALE[language],
      alternateLocale: LANGUAGES.filter((other) => other !== language).map(
        (other) => OG_LOCALE[other],
      ),
      url: "/",
      siteName: CONTACT.company,
      title,
      description,
    },
    // The preview image and its `alt` are declared by `app/opengraph-image.tsx`
    // and `app/twitter-image.tsx`; here only the large card is requested, which
    // is the one that shows it whole.
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
