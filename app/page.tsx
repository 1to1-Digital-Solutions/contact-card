import { ContactCardExperience } from "@/components/contact-card/contact-card-experience";
import { JsonLd, personSchema } from "@/components/geo/json-ld";
import { contactIn } from "@/lib/contact";
import { qrCode } from "@/lib/qr";
import { requestLanguage } from "@/lib/request-language";
import { SITE_URL } from "@/lib/site";

/**
 * The QR code is computed here, on the server, once per render: the address
 * is a build-time constant, so the browser gets the finished path and no
 * encoder.
 */
const QR = qrCode(SITE_URL);

export default async function Home() {
  const language = await requestLanguage();

  return (
    <main>
      <JsonLd data={personSchema(contactIn(language))} />
      <ContactCardExperience language={language} qr={QR} url={SITE_URL} />
    </main>
  );
}
