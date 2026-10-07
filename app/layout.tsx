import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { buildMetadata } from "@/lib/metadata";
import { requestLanguage } from "@/lib/request-language";
import { CHROME_COLOR, DEFAULT_THEME, THEME_SCRIPT } from "@/lib/theme";
import "./globals.css";

/**
 * The title and the description go in the negotiated language, like the
 * page: they are what is read when sharing the link.
 */
export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata(await requestLanguage());
}

export const viewport: Viewport = {
  // The page background. It is not declared via `prefers-color-scheme`
  // because the theme is not chosen by the system but by the button: it goes
  // out with the starting one and the script corrects it with the remembered
  // one, before painting.
  themeColor: CHROME_COLOR[DEFAULT_THEME],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // The language does travel resolved in the HTML: unlike the theme, it
  // cannot be corrected before painting (by then the text is already written).
  const language = await requestLanguage();
  // The Content Security Policy only lets scripts with the nonce of this
  // request run (`proxy.ts` mints it). The theme script is inline, so it has
  // to carry it; Next.js stamps its own scripts on its own.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    // The starting theme travels in the HTML and the script corrects it,
    // before painting, with the one remembered from the browser.
    <html lang={language} className={DEFAULT_THEME} suppressHydrationWarning>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
