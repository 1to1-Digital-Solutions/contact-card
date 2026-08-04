import { CONTACT } from "./contact";

/**
 * Origen público del sitio. Se puede fijar con `NEXT_PUBLIC_SITE_URL`
 * (necesario en despliegues de vista previa); si el valor no es una URL
 * válida se ignora, porque `metadataBase`, `robots.txt` y el sitemap se
 * generan en build y una variable mal puesta tumbaría la compilación.
 */
export function resolveSiteUrl(raw: string | undefined): string {
  if (!raw) return CONTACT.websiteUrl;
  try {
    return new URL(raw).origin;
  } catch {
    return CONTACT.websiteUrl;
  }
}

export const SITE_URL = resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
