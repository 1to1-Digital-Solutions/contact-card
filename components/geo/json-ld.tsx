import { type Contact, PROFILES } from "@/lib/contact";
import { SITE_URL } from "@/lib/site";

/**
 * Inserts schema.org structured data. It escapes `<` so no value can close
 * the `<script>` tag and sneak markup into the page.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

/**
 * The person's profile with their company, for search engines and AI
 * engines. It receives the contact already resolved into a language: the job
 * title and what they do go in the one being served, which is the same one
 * `<html lang>` announces.
 */
export function personSchema(contact: Contact) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: contact.name,
    givenName: contact.givenName,
    familyName: contact.familyName,
    jobTitle: contact.jobTitle,
    // What they do, which is what gets answered when someone asks about a
    // person. It is the services line and not the tagline: the tagline
    // promises, and here what is done is declared. It is also the text read
    // in the data panel.
    description: contact.services,
    email: `mailto:${contact.email}`,
    telephone: contact.phoneE164,
    url: SITE_URL,
    // `sameAs` is how to say "this person is also the one in these profiles":
    // it is what ties the profile to LinkedIn and GitHub.
    sameAs: PROFILES.map((profile) => profile.url),
    worksFor: {
      "@type": "Organization",
      name: contact.company,
      url: contact.websiteUrl,
      description: contact.services,
    },
  };
}
