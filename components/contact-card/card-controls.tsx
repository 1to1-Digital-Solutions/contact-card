"use client";

/** Botón sobrio de la escena: se lee sobre cualquiera de los dos temas. */
export const CONTROL_CLASSES =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-ink/15 bg-ink/5 px-5 text-sm font-medium text-ink backdrop-blur transition-colors hover:bg-ink/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-ink";

/**
 * Los dos mandos de la tarjeta. Viven aquí y no en la escena porque los usan
 * los dos sitios donde aparecen: bajo la tarjeta en pantalla ancha y dentro
 * de la hoja de datos en móvil.
 */
export function CardControls({
  showingBack,
  onFlip,
  onReset,
}: {
  showingBack: boolean;
  onFlip: () => void;
  onReset: () => void;
}) {
  return (
    <>
      <button type="button" onClick={onFlip} className={CONTROL_CLASSES}>
        {showingBack ? "Ver el anverso" : "Ver el reverso"}
      </button>
      <button type="button" onClick={onReset} className={CONTROL_CLASSES}>
        Recolocar
      </button>
    </>
  );
}
