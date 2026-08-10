/**
 * Fuente única de verdad de los datos de contacto.
 * Todo lo que se pinta (tarjeta 3D, panel HTML, vCard, JSON-LD) sale de aquí.
 */

import type { Language } from "./i18n";

/** Los datos que se escriben igual en cualquier idioma, que son casi todos. */
export type ContactData = {
  /** Nombre completo, tal y como se muestra. */
  name: string;
  /** Nombre de pila (para la vCard estructurada). */
  givenName: string;
  /** Apellidos (para la vCard estructurada). */
  familyName: string;
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

/** Los datos ya resueltos en un idioma: así los consume todo lo que pinta. */
export type Contact = ContactData & {
  /** Cargo profesional: `TITLE` en la vCard, `jobTitle` en schema.org. */
  jobTitle: string;
};

export const CONTACT: ContactData = {
  name: "César Peón Lamparero",
  givenName: "César",
  familyName: "Peón Lamparero",
  company: "1to1 Digital Solutions",
  email: "cesarpl@1to1digital.solutions",
  phone: "+34 685 399 864",
  phoneE164: "+34685399864",
  website: "1to1digital.solutions",
  websiteUrl: "https://1to1digital.solutions",
};

/**
 * El cargo es el único dato que cambia con el idioma: el nombre, la empresa,
 * el teléfono, el email y la web se escriben igual en los dos. Vive aquí y no
 * en el diccionario porque es un dato de la ficha, no un texto de la interfaz.
 */
export const JOB_TITLE: Record<Language, string> = {
  es: "Desarrollador full-stack",
  en: "Full-stack developer",
};

/** Los datos de contacto en un idioma. */
export function contactIn(language: Language): Contact {
  return { ...CONTACT, jobTitle: JOB_TITLE[language] };
}
