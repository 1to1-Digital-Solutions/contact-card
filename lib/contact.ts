/**
 * Single source of truth for the contact details.
 * Everything that gets drawn (3D card, HTML panel, vCard, JSON-LD) comes from here.
 */

import type { Language } from "./i18n";

/** The details that are written the same in every language, which is almost all of them. */
export type ContactData = {
  /** Full name, exactly as displayed. */
  name: string;
  /** Given name (for the structured vCard). */
  givenName: string;
  /** Family name (for the structured vCard). */
  familyName: string;
  company: string;
  email: string;
  /** Phone in readable form, with separators. */
  phone: string;
  /** Same phone in E.164, for `tel:` and for the vCard. */
  phoneE164: string;
  /** Domain without protocol, exactly as displayed. */
  website: string;
  /** Absolute URL of the site. */
  websiteUrl: string;
};

/**
 * What the profile says differently in each language. It is data, not
 * interface: it speaks of who this is and what they do, and it is printed on
 * the card like the name or the email. It changes when the business changes,
 * not when the screen does, so it lives here and not in `lib/dictionary.ts`,
 * where the labels that accompany it are.
 */
export type ContactText = {
  /** Job title: `TITLE` in the vCard, `jobTitle` in schema.org. */
  jobTitle: string;
  /** Company tagline: what it promises, on the card itself. */
  tagline: string;
  /** What the business does, in plain words. Goes in the details panel, not on the card. */
  services: string;
};

/** The details already resolved in one language: this is what everything that draws consumes. */
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

/** A public professional profile, of the kind linked from the details panel. */
export type Profile = {
  /** Name of the network: it is a proper noun and is written the same in both languages. */
  name: string;
  /** Readable address, without protocol: it is what is shown and what gets copied. */
  address: string;
  /** Absolute URL the link leads to, in its canonical form. */
  url: string;
};

/**
 * The profiles do not go inside `CONTACT` because they are not profile data:
 * they are not saved to the address book nor drawn on the card, only linked
 * from the panel and declared in the JSON-LD `sameAs`.
 *
 * The accents in the LinkedIn path are percent-encoded: that is how the
 * profile's address is written, and `contact.test.ts` pins that form.
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
 * The profile texts, language by language: they are the only thing that
 * changes with it, because the name, the company, the phone, the email and
 * the website are written the same in both.
 *
 * The type forces each one to exist in every language, and `Contact` forces
 * `contactIn` not to leave any unresolved: adding a new text does not compile
 * until it is written in both places.
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

/** The contact details in one language. */
export function contactIn(language: Language): Contact {
  return {
    ...CONTACT,
    jobTitle: TRANSLATED.jobTitle[language],
    tagline: TRANSLATED.tagline[language],
    services: TRANSLATED.services[language],
  };
}
