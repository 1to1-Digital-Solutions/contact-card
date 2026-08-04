import { ContactCardExperience } from "@/components/contact-card/contact-card-experience";
import { JsonLd, personSchema } from "@/components/geo/json-ld";

export default function Home() {
  return (
    <main>
      <JsonLd data={personSchema()} />
      <ContactCardExperience />
    </main>
  );
}
