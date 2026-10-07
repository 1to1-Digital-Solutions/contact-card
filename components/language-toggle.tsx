"use client";

import { dictionary } from "@/lib/dictionary";
import { type Language, nextLanguage } from "@/lib/i18n";

/**
 * Switches the page language. Detection via `Accept-Language` gets it right
 * almost always, but this button covers what it cannot get right: showing
 * the card on your phone to someone who does not read your language, which
 * is half the point of having a digital card at an event.
 *
 * Like the theme one, it shows where it leads and not where you are. And it
 * says so in the target language, with its `lang`, so that whoever does not
 * read the page's language understands it —and a screen reader pronounces it
 * properly—.
 */
export function LanguageToggle({
  language,
  onToggle,
  className = "",
}: {
  language: Language;
  onToggle: () => void;
  className?: string;
}) {
  const target = nextLanguage(language);
  const t = dictionary(target).language;

  return (
    <button
      type="button"
      onClick={onToggle}
      lang={target}
      aria-label={t.switchTo}
      className={`inline-flex size-11 items-center justify-center rounded-full border border-ink/15 bg-ink/5 text-sm font-semibold text-ink backdrop-blur transition-colors hover:bg-ink/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-ink ${className}`}
    >
      {t.code}
    </button>
  );
}
