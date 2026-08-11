"use client";

import { CopyButton } from "@/components/copy-button";
import { type Contact, contactIn, PROFILES } from "@/lib/contact";
import { type Dictionary, dictionary } from "@/lib/dictionary";
import type { Language } from "@/lib/i18n";
import { buildVCard, vCardFilename } from "@/lib/vcard";

/**
 * Alto de objetivo táctil incluido: el valor va emparejado con su botón. Los
 * que no caben en una línea —la dirección de un perfil— parten por sus guiones
 * antes que a mitad de palabra, y solo si no hay más remedio.
 */
const VALUE_CLASSES = "inline-flex min-h-11 items-center break-words text-lg text-ink";

/** Un dato del panel: rótulo, valor que se ve y se copia, y a dónde lleva. */
type PanelField = {
  label: string;
  value: string;
  href?: string;
  /** Los perfiles salen del sitio: no les cuentes de dónde viene quien pulsa. */
  rel?: string;
  /** Nombre accesible cuando el texto visible es solo una dirección. */
  linkLabel?: string;
};

/**
 * El cargo no lleva `href`: es un dato de la ficha, no algo que se pueda abrir.
 * Los perfiles van al final, detrás de las formas de contactar, y salen de
 * `PROFILES` para que las direcciones estén escritas en un solo sitio.
 */
function fieldsOf(contact: Contact, t: Dictionary): PanelField[] {
  return [
    { label: t.fields.jobTitle, value: contact.jobTitle },
    { label: t.fields.email, value: contact.email, href: `mailto:${contact.email}` },
    { label: t.fields.phone, value: contact.phone, href: `tel:${contact.phoneE164}` },
    { label: t.fields.website, value: contact.website, href: contact.websiteUrl },
    ...PROFILES.map((profile) => ({
      label: profile.name,
      value: profile.address,
      href: profile.url,
      rel: "noreferrer",
      linkLabel: t.panel.profile(profile.name, profile.address),
    })),
  ];
}

function downloadVCard(contact: Contact) {
  const blob = new Blob([buildVCard(contact)], {
    type: "text/vcard;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = vCardFilename(contact);
  document.body.append(link);
  link.click();
  link.remove();
  // Revocar en el mismo tick que el clic deja a Safari sin fichero que
  // descargar: se libera en cuanto el navegador ha tomado el blob.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * Los mismos datos que lleva la tarjeta 3D, en HTML: es lo que leen los
 * lectores de pantalla y los buscadores, lo que se puede pulsar para llamar
 * o escribir desde el móvil, y lo que se copia de uno en uno.
 */
export function ContactPanel({ language }: { language: Language }) {
  const t = dictionary(language);
  const contact = contactIn(language);

  return (
    <div className="flex flex-col gap-6">
      <dl className="flex flex-col gap-1">
        {fieldsOf(contact, t).map((field) => (
          <div key={field.label} className="border-t border-ink/10 py-2">
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
              {field.label}
            </dt>
            <dd className="mt-1 flex items-center justify-between gap-3">
              {field.href ? (
                <a
                  className={`${VALUE_CLASSES} underline decoration-ink/25 underline-offset-4 transition-colors hover:decoration-accent-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-ink`}
                  href={field.href}
                  rel={field.rel}
                  aria-label={field.linkLabel}
                >
                  {field.value}
                </a>
              ) : (
                <span className={VALUE_CLASSES}>{field.value}</span>
              )}
              <CopyButton value={field.value} label={field.label} language={language} />
            </dd>
          </div>
        ))}
      </dl>

      <button
        type="button"
        onClick={() => downloadVCard(contact)}
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-on-accent transition-transform hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-ink motion-reduce:transition-none motion-reduce:hover:scale-100"
      >
        {t.panel.save}
      </button>
    </div>
  );
}
