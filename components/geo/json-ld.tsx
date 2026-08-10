import type { Contact } from "@/lib/contact";
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

/**
 * Ficha de la persona con su empresa, para buscadores y motores de IA. Recibe
 * el contacto ya resuelto en un idioma: el cargo va en el que se está
 * sirviendo, que es el mismo que anuncia `<html lang>`.
 */
export function personSchema(contact: Contact) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: contact.name,
    givenName: contact.givenName,
    familyName: contact.familyName,
    jobTitle: contact.jobTitle,
    email: `mailto:${contact.email}`,
    telephone: contact.phoneE164,
    url: SITE_URL,
    worksFor: {
      "@type": "Organization",
      name: contact.company,
      url: contact.websiteUrl,
    },
  };
}
