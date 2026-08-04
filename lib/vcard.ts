import type { Contact } from "./contact";

const CRLF = "\r\n";

/**
 * Escapa un valor de vCard según RFC 6350 §3.4: la barra invertida primero
 * (si no, se re-escaparían las barras que introducimos después), y luego
 * los separadores y los saltos de línea.
 */
export function escapeVCardValue(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n?/g, "\n")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

/**
 * Construye una vCard 3.0 (la versión que aún importan sin fricción los
 * contactos de iOS y Android) a partir de los datos de contacto.
 *
 * No aplica el plegado de líneas a 75 octetos del estándar: ningún campo
 * nuestro se acerca a ese límite y plegar en UTF-8 exige no partir
 * caracteres multibyte. Si algún día hay campos largos, habrá que añadirlo.
 */
export function buildVCard(contact: Contact): string {
  const e = escapeVCardValue;
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${e(contact.familyName)};${e(contact.givenName)};;;`,
    `FN:${e(contact.name)}`,
    `ORG:${e(contact.company)}`,
    `EMAIL;TYPE=INTERNET,WORK:${e(contact.email)}`,
    `TEL;TYPE=CELL,WORK:${e(contact.phoneE164)}`,
    `URL:${e(contact.websiteUrl)}`,
    "END:VCARD",
  ];
  return lines.join(CRLF) + CRLF;
}

/** Nombre de fichero sugerido al descargar, sin acentos ni espacios. */
export function vCardFilename(contact: Contact): string {
  const slug = contact.name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return `${slug}.vcf`;
}
