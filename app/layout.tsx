import type { Metadata, Viewport } from "next";
import { CONTACT } from "@/lib/contact";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const DESCRIPTION = `Tarjeta de contacto interactiva de ${CONTACT.name}, de ${CONTACT.company}: arrástrala, gírala y guarda los datos en tu agenda.`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${CONTACT.name} — Tarjeta de contacto`,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "profile",
    locale: "es_ES",
    url: "/",
    siteName: CONTACT.company,
    title: `${CONTACT.name} — Tarjeta de contacto`,
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1120",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
