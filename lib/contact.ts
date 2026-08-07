/**
 * Fuente única de verdad de los datos de contacto.
 * Todo lo que se pinta (tarjeta 3D, panel HTML, vCard, JSON-LD) sale de aquí.
 */

export type Contact = {
  /** Nombre completo, tal y como se muestra. */
  name: string;
  /** Nombre de pila (para la vCard estructurada). */
  givenName: string;
  /** Apellidos (para la vCard estructurada). */
  familyName: string;
  /** Cargo profesional: `TITLE` en la vCard, `jobTitle` en schema.org. */
  jobTitle: string;
  company: string;
  email: string;
  /** Teléfono en formato legible, con separadores. */
  phone: string;
  /** Mismo teléfono en E.164, para `tel:` y para la vCard. */
  phoneE164: string;
  /** Dominio sin protocolo, tal y como se muestra. */
  website: string;
  /** URL absoluta del sitio. */
  websiteUrl: string;
};

export const CONTACT: Contact = {
  name: "César Peón Lamparero",
  givenName: "César",
  familyName: "Peón Lamparero",
  jobTitle: "Desarrollador full-stack",
  company: "1to1 Digital Solutions",
  email: "cesarpl@1to1digital.solutions",
  phone: "+34 685 399 864",
  phoneE164: "+34685399864",
  website: "1to1digital.solutions",
  websiteUrl: "https://1to1digital.solutions",
};
