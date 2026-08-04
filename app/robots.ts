import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Es una tarjeta de contacto pública: interesa que la encuentren tanto los
 * buscadores como los motores de IA que citan fuentes. Los bots de
 * entrenamiento se dejan permitidos de forma explícita; si algún día no
 * debe cederse el contenido para entrenar, se cambian a `disallow`.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    // `Host` es un nombre de dominio, sin esquema: con él se ignora la directiva.
    host: new URL(SITE_URL).host,
  };
}
