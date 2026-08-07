import type { Metadata, Viewport } from "next";
import { CONTACT } from "@/lib/contact";
import { SITE_URL } from "@/lib/site";
import { CHROME_COLOR, DEFAULT_THEME, THEME_SCRIPT } from "@/lib/theme";
import "./globals.css";

const TITLE = `${CONTACT.name} — Tarjeta de contacto`;
const DESCRIPTION = `Tarjeta de contacto interactiva de ${CONTACT.name}, de ${CONTACT.company}: arrástrala, gírala y guarda los datos en tu agenda.`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "profile",
    locale: "es_ES",
    url: "/",
    siteName: CONTACT.company,
    title: TITLE,
    description: DESCRIPTION,
  },
  // La imagen de la previsualización y su `alt` los declaran
  // `app/opengraph-image.tsx` y `app/twitter-image.tsx`; aquí solo se pide la
  // tarjeta grande, que es la que la enseña entera.
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  // El fondo de la página. No se declara por `prefers-color-scheme` porque el
  // tema no lo elige el sistema, sino el botón: sale con el de partida y el
  // script lo corrige con el que se recordó, antes de pintar.
  themeColor: CHROME_COLOR[DEFAULT_THEME],
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
