import { CONTACT } from "@/lib/contact";
import { SITE_URL } from "@/lib/site";

/**
 * Inserta datos estructurados schema.org. Escapa `<` para que ningún valor
 * pueda cerrar la etiqueta `<script>` y colar marcado en la página.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

/** Ficha de la persona con su empresa, para buscadores y motores de IA. */
export function personSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: CONTACT.name,
    givenName: CONTACT.givenName,
    familyName: CONTACT.familyName,
    email: `mailto:${CONTACT.email}`,
    telephone: CONTACT.phoneE164,
    url: SITE_URL,
    worksFor: {
      "@type": "Organization",
      name: CONTACT.company,
      url: CONTACT.websiteUrl,
    },
  };
}
