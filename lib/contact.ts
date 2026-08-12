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

/**
 * Lo que la ficha dice distinto en cada idioma. Son datos, no interfaz: hablan
 * de quién es y de qué hace, y salen impresos en la tarjeta como el nombre o el
 * email. Cambian si cambia el negocio, no si cambia la pantalla, así que viven
 * aquí y no en `lib/dictionary.ts`, donde están los rótulos que los acompañan.
 */
export type ContactText = {
  /** Cargo profesional: `TITLE` en la vCard, `jobTitle` en schema.org. */
  jobTitle: string;
  /** Lema de la empresa: lo que promete, en la propia tarjeta. */
  tagline: string;
  /** A qué se dedica, dicho en claro. Va en el panel de datos, no en la tarjeta. */
  services: string;
};

/** Los datos ya resueltos en un idioma: así los consume todo lo que pinta. */
export type Contact = ContactData & ContactText;

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
 * Los textos de la ficha, idioma a idioma: son lo único que cambia con él,
 * porque el nombre, la empresa, el teléfono, el email y la web se escriben
 * igual en los dos.
 *
 * El tipo obliga a que cada uno esté en todos los idiomas, y `Contact` a que
 * `contactIn` no se deje ninguno sin resolver: añadir un texto nuevo no compila
 * hasta que está escrito en los dos sitios.
 */
export const TRANSLATED: Record<keyof ContactText, Record<Language, string>> = {
  jobTitle: {
    es: "Desarrollador full-stack",
    en: "Full-stack developer",
  },
  tagline: {
    es: "Tú creas tu negocio, nosotros nos encargamos de tu tecnología.",
    en: "You build your business, we take care of your technology.",
  },
  services: {
    es: "Desarrollo de software personalizado",
    en: "Custom software development",
  },
};

/** Los datos de contacto en un idioma. */
export function contactIn(language: Language): Contact {
  return {
    ...CONTACT,
    jobTitle: TRANSLATED.jobTitle[language],
    tagline: TRANSLATED.tagline[language],
    services: TRANSLATED.services[language],
  };
}
