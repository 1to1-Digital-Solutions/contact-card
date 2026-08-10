import { ContactCardExperience } from "@/components/contact-card/contact-card-experience";
import { JsonLd, personSchema } from "@/components/geo/json-ld";
import { contactIn } from "@/lib/contact";
import { requestLanguage } from "@/lib/request-language";

export default async function Home() {
  const language = await requestLanguage();

  return (
    <main>
      <JsonLd data={personSchema(contactIn(language))} />
      <ContactCardExperience language={language} />
    </main>
  );
}
