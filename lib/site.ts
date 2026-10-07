/**
 * Where the card is published. It is the fallback for `SITE_URL`, so a build
 * with no variable set still points `metadataBase`, `robots.txt`, the sitemap
 * and the shared link at the card itself and not at the company website,
 * which is a different site on the parent domain.
 */
export const CARD_URL = "https://card.1to1digital.solutions";

/**
 * Public origin of the site. It can be set with `NEXT_PUBLIC_SITE_URL`
 * (needed in preview deployments); if the value is not a valid URL it is
 * ignored, because `metadataBase`, `robots.txt` and the sitemap are generated
 * at build time and a misconfigured variable would take the build down.
 */
export function resolveSiteUrl(raw: string | undefined): string {
  if (!raw) return CARD_URL;
  try {
    return new URL(raw).origin;
  } catch {
    return CARD_URL;
  }
}

export const SITE_URL = resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
