"use client";

import { CopyButton } from "@/components/copy-button";
import { type Contact, contactIn, PROFILES } from "@/lib/contact";
import { type Dictionary, dictionary } from "@/lib/dictionary";
import type { Language } from "@/lib/i18n";
import { buildVCard, vCardFilename } from "@/lib/vcard";

/**
 * Touch target height included: the value is paired with its button. Those
 * that do not fit on one line —a profile's address— break at their hyphens
 * before breaking mid-word, and only if there is no other way.
 *
 * In the two columns of the landscape layout the value stops being a flex
 * box: a flex box is one both outside and inside, and inside it will not go
 * narrower than its longest word, so the email pushed its copy button out of
 * the column. The single-track grid that can shrink (`minmax(0,1fr)`) breaks
 * the text instead of overflowing it, and centers just like `items-center`.
 */
const VALUE_CLASSES =
  "inline-flex min-h-11 items-center break-words text-lg text-ink phone-landscape:grid phone-landscape:min-w-0 phone-landscape:grid-cols-[minmax(0,1fr)] phone-landscape:content-center phone-landscape:text-base";

/** One panel field: label, the value that is shown and copied, and where it leads. */
type PanelField = {
  label: string;
  value: string;
  href?: string;
  /** Profiles leave the site: do not tell them where whoever clicks comes from. */
  rel?: string;
  /** Accessible name when the visible text is only an address. */
  linkLabel?: string;
};

/**
 * The job title and the services have no `href`: they are profile data, not
 * something that can be opened. They go first because they say who this is
 * and what they do, which is what one looks at before deciding whether to
 * write. The profiles go at the end, after the ways to get in touch, and
 * come from `PROFILES` so the addresses are written in a single place.
 */
function fieldsOf(contact: Contact, t: Dictionary): PanelField[] {
  return [
    { label: t.fields.jobTitle, value: contact.jobTitle },
    { label: t.fields.services, value: contact.services },
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
  // Revoking in the same tick as the click leaves Safari with no file to
  // download: it is released as soon as the browser has taken the blob.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * The same data the 3D card carries, in HTML: it is what screen readers and
 * search engines read, what can be tapped to call or write from a phone, and
 * what gets copied one item at a time.
 */
export function ContactPanel({ language }: { language: Language }) {
  const t = dictionary(language);
  const contact = contactIn(language);

  return (
    <div className="flex flex-col gap-6 phone-landscape:gap-3">
      {/* In landscape the data goes in two columns: that is where width is
          spare and height is short, and in a single column only two showed
          at once. */}
      <dl className="flex flex-col gap-1 phone-landscape:grid phone-landscape:grid-cols-2 phone-landscape:gap-x-5">
        {fieldsOf(contact, t).map((field) => (
          <div key={field.label} className="border-t border-ink/10 py-2 phone-landscape:py-1">
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
              {field.label}
            </dt>
            <dd className="mt-1 flex items-center justify-between gap-3 phone-landscape:mt-0">
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

      {/* The primary action is not earned by scrolling: in landscape it stays
          stuck to the bottom edge of the sheet, padding included, while the
          data passes behind it. Without pushing it down to the edge they
          would show below the button; its own padding gives back the air it
          eats up. */}
      <div className="flex flex-col phone-landscape:sticky phone-landscape:-bottom-4 phone-landscape:-mb-4 phone-landscape:bg-backdrop phone-landscape:pb-4 phone-landscape:pt-2">
        <button
          type="button"
          onClick={() => downloadVCard(contact)}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-on-accent transition-transform hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-ink motion-reduce:transition-none motion-reduce:hover:scale-100"
        >
          {t.panel.save}
        </button>
      </div>
    </div>
  );
}
