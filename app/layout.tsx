import type { Metadata, Viewport } from "next";
import { buildMetadata } from "@/lib/metadata";
import { requestLanguage } from "@/lib/request-language";
import { CHROME_COLOR, DEFAULT_THEME, THEME_SCRIPT } from "@/lib/theme";
import "./globals.css";

/**
 * El título y la descripción van en el idioma negociado, igual que la página:
 * son lo que se lee al compartir el enlace.
 */
export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata(await requestLanguage());
}

export const viewport: Viewport = {
  // El fondo de la página. No se declara por `prefers-color-scheme` porque el
  // tema no lo elige el sistema, sino el botón: sale con el de partida y el
  // script lo corrige con el que se recordó, antes de pintar.
  themeColor: CHROME_COLOR[DEFAULT_THEME],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // El idioma sí viaja resuelto en el HTML: a diferencia del tema, no se puede
  // corregir antes de pintar (para entonces el texto ya está escrito).
  const language = await requestLanguage();

  return (
    // El tema de partida viaja en el HTML y el script lo corrige, antes de
    // pintar, con el que se recordó del navegador.
    <html lang={language} className={DEFAULT_THEME} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
