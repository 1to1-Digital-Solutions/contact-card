import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * It is a public contact card: it is in our interest that both search
 * engines and the AI engines that cite sources find it. Training bots are
 * explicitly left allowed; if one day the content must not be handed over
 * for training, they are switched to `disallow`.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    // `Host` is a domain name, without scheme: with one, the directive is ignored.
    host: new URL(SITE_URL).host,
  };
}
