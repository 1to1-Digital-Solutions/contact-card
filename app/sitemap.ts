import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Public routes. When adding a new page, add it here. */
const STATIC_ROUTES = ["/"];

export default function sitemap(): MetadataRoute.Sitemap {
  return STATIC_ROUTES.map((route) => ({
    url: new URL(route, SITE_URL).toString(),
    changeFrequency: "monthly",
    priority: route === "/" ? 1 : 0.7,
  }));
}
