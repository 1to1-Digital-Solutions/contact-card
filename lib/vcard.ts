import type { Contact } from "./contact";

const CRLF = "\r\n";

/**
 * Escapes a vCard value per RFC 6350 §3.4: the backslash first (otherwise
 * the backslashes we introduce afterwards would get re-escaped), and then the
 * separators and the line breaks.
 */
export function escapeVCardValue(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n?/g, "\n")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\;");
}

/**
 * Builds a vCard 3.0 (the version that iOS and Android contacts still import
 * without friction) from the contact data.
 *
 * It does not apply the standard's line folding at 75 octets: none of our
 * fields comes close to that limit and folding in UTF-8 requires not
 * splitting multibyte characters. If one day there are long fields, it will
 * have to be added.
 */
export function buildVCard(contact: Contact): string {
  const e = escapeVCardValue;
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${e(contact.familyName)};${e(contact.givenName)};;;`,
    `FN:${e(contact.name)}`,
    `ORG:${e(contact.company)}`,
    `TITLE:${e(contact.jobTitle)}`,
    `EMAIL;TYPE=INTERNET,WORK:${e(contact.email)}`,
    `TEL;TYPE=CELL,WORK:${e(contact.phoneE164)}`,
    `URL:${e(contact.websiteUrl)}`,
    "END:VCARD",
  ];
  return lines.join(CRLF) + CRLF;
}

/** File name suggested on download, without accents or spaces. */
export function vCardFilename(contact: Contact): string {
  const slug = contact.name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return `${slug}.vcf`;
}
