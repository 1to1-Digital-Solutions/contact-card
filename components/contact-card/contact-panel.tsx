"use client";

import { CopyButton } from "@/components/copy-button";
import { CONTACT } from "@/lib/contact";
import { buildVCard, vCardFilename } from "@/lib/vcard";

/** El cargo no lleva `href`: es un dato de la ficha, no algo que se pueda abrir. */
const FIELDS: Array<{ label: string; value: string; href?: string }> = [
  { label: "Cargo", value: CONTACT.jobTitle },
  { label: "Email", value: CONTACT.email, href: `mailto:${CONTACT.email}` },
  { label: "Teléfono", value: CONTACT.phone, href: `tel:${CONTACT.phoneE164}` },
  { label: "Web", value: CONTACT.website, href: CONTACT.websiteUrl },
];

/** Alto de objetivo táctil incluido: el valor va emparejado con su botón. */
const VALUE_CLASSES = "inline-flex min-h-11 items-center break-all text-lg text-ink";

function downloadVCard() {
  const blob = new Blob([buildVCard(CONTACT)], {
    type: "text/vcard;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = vCardFilename(CONTACT);
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
export function ContactPanel() {
  return (
    <div className="flex flex-col gap-6">
      <dl className="flex flex-col gap-1">
        {FIELDS.map((field) => (
          <div key={field.label} className="border-t border-ink/10 py-2">
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
              {field.label}
            </dt>
            <dd className="mt-1 flex items-center justify-between gap-3">
              {field.href ? (
                <a
                  className={`${VALUE_CLASSES} underline decoration-ink/25 underline-offset-4 transition-colors hover:decoration-accent-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-ink`}
                  href={field.href}
                >
                  {field.value}
                </a>
              ) : (
                <span className={VALUE_CLASSES}>{field.value}</span>
              )}
              <CopyButton value={field.value} label={field.label} />
            </dd>
          </div>
        ))}
      </dl>

      <button
        type="button"
        onClick={downloadVCard}
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-on-accent transition-transform hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-ink motion-reduce:transition-none motion-reduce:hover:scale-100"
      >
        Guardar contacto (.vcf)
      </button>
    </div>
  );
}
