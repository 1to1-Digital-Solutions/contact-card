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

/** Un perfil profesional público, de los que se enlazan en el panel de datos. */
export type Profile = {
  /** Nombre de la red: es un nombre propio y se escribe igual en los dos idiomas. */
  name: string;
  /** Dirección legible, sin protocolo: es lo que se enseña y lo que se copia. */
  address: string;
  /** URL absoluta a la que lleva el enlace, en su forma canónica. */
  url: string;
};

/**
 * Los perfiles no van dentro de `CONTACT` porque no son datos de la ficha: no
 * se guardan en la agenda ni se pintan en la tarjeta, solo se enlazan en el
 * panel y se declaran en `sameAs` del JSON-LD.
 *
 * Los acentos de la ruta de LinkedIn van percent-encoded: así es como está
 * escrita la dirección del perfil, y `contact.test.ts` fija esa forma.
 */
export const PROFILES: readonly Profile[] = [
  {
    name: "LinkedIn",
    address: "linkedin.com/in/césar-peón-lamparero",
    url: "https://www.linkedin.com/in/c%C3%A9sar-pe%C3%B3n-lamparero/",
  },
  {
    name: "GitHub",
    address: "github.com/cpl121",
    url: "https://github.com/cpl121",
  },
];

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
