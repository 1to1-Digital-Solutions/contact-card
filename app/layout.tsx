import type { Metadata, Viewport } from "next";
import { THEMES } from "@/lib/brand";
import { CONTACT } from "@/lib/contact";
import { SITE_URL } from "@/lib/site";
import { DEFAULT_THEME, THEME_SCRIPT } from "@/lib/theme";
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
  // El fondo de la página en cada tema. Los metadatos no leen el CSS, así que
  // el navegador se guía por la preferencia del sistema: es lo único que
  // conoce antes de que corra el script del tema.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEMES.light.backdrop },
    { media: "(prefers-color-scheme: dark)", color: THEMES.dark.backdrop },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // El tema de partida viaja en el HTML y el script lo corrige, antes de
    // pintar, con el que se recordó del navegador.
    <html lang="es" className={DEFAULT_THEME} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
