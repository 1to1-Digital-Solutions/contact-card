"use client";

import { dictionary } from "@/lib/dictionary";
import { type Language, nextLanguage } from "@/lib/i18n";

/**
 * Cambia el idioma de la página. La detección por `Accept-Language` acierta
 * casi siempre, pero este botón cubre lo que no puede acertar: enseñar la
 * tarjeta en tu móvil a alguien que no lee tu idioma, que es medio motivo de
 * tener una tarjeta digital en un evento.
 *
 * Como el de tema, muestra a dónde lleva y no dónde se está. Y lo dice en el
 * idioma de destino, con su `lang`, para que lo entienda —y lo pronuncie bien
 * un lector de pantalla— quien no lee el de la página.
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
