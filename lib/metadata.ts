import type { Metadata } from "next";
import { CONTACT } from "./contact";
import { dictionary } from "./dictionary";
import { type Language, LANGUAGES, OG_LOCALE } from "./i18n";
import { SITE_URL } from "./site";

/**
 * Los metadatos de la página en el idioma que se sirve. Van en `lib/` y no en
 * el layout para poder comprobarlos sin arrastrar `next/headers`.
 *
 * No hay una URL por idioma que declarar en `alternates.languages`: es la
 * misma página negociada con el navegador. Lo que sí se dice es que existe la
 * otra versión, con `alternateLocale`.
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
    // La imagen de la previsualización y su `alt` los declaran
    // `app/opengraph-image.tsx` y `app/twitter-image.tsx`; aquí solo se pide la
    // tarjeta grande, que es la que la enseña entera.
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
