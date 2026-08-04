"use client";

import { CONTACT } from "@/lib/contact";
import { buildVCard, vCardFilename } from "@/lib/vcard";

const FIELDS = [
  { label: "Email", value: CONTACT.email, href: `mailto:${CONTACT.email}` },
  { label: "Teléfono", value: CONTACT.phone, href: `tel:${CONTACT.phoneE164}` },
  { label: "Web", value: CONTACT.website, href: CONTACT.websiteUrl },
];

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
  URL.revokeObjectURL(url);
}

/**
 * Los mismos datos que lleva la tarjeta 3D, en HTML: es lo que leen los
 * lectores de pantalla y los buscadores, y lo que se puede pulsar para
 * llamar o escribir desde el móvil.
 */
export function ContactPanel() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink-inverse sm:text-4xl">
          {CONTACT.name}
        </h1>
        <p className="mt-2 text-sm font-semibold uppercase tracking-[0.2em] text-accent">
          {CONTACT.company}
        </p>
      </div>

      <dl className="flex flex-col gap-1">
        {FIELDS.map((field) => (
          <div key={field.label} className="border-t border-white/10 py-3">
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-inverse-muted">
              {field.label}
            </dt>
            <dd className="mt-1">
              <a
                className="inline-flex min-h-11 items-center text-lg text-ink-inverse underline decoration-white/25 underline-offset-4 transition-colors hover:decoration-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                href={field.href}
              >
                {field.value}
              </a>
            </dd>
          </div>
        ))}
      </dl>

      <button
        type="button"
        onClick={downloadVCard}
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-ink transition-transform hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent motion-reduce:transition-none motion-reduce:hover:scale-100"
      >
        Guardar contacto (.vcf)
      </button>
    </div>
  );
}
