"use client";

import type { ReactNode } from "react";

/**
 * Botón sobrio de la escena: se lee sobre cualquiera de los dos temas. El
 * `pointer-events-auto` va en el botón y no en la fila que los agrupa: esa
 * fila ocupa todo el ancho en cuanto los mandos se reparten en dos líneas, y
 * desde ahí se tragaría el gesto en los huecos entre botones.
 */
const CONTROL_CLASSES =
  "pointer-events-auto inline-flex size-11 items-center justify-center gap-2 rounded-full border border-ink/15 bg-ink/5 text-sm font-medium text-ink backdrop-blur transition-colors hover:bg-ink/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-ink sm:w-auto sm:px-5";

/**
 * Mando de la escena. En pantalla estrecha es solo el icono, para que los tres
 * quepan en una línea y la tarjeta se quede con el resto del alto; a partir de
 * `sm` el rótulo aparece al lado. La etiqueta accesible está siempre, y es
 * exactamente el rótulo que se ve al ensanchar: el nombre de un control tiene
 * que contener su texto visible para poder pulsarlo por voz (WCAG 2.5.3).
 */
export function SceneControl({
  label,
  icon,
  onClick,
  className = "",
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`${CONTROL_CLASSES} ${className}`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

/** Trazo común de los iconos: el mismo grosor y remate que los de la cabecera. */
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5 shrink-0"
    >
      {children}
    </svg>
  );
}

/**
 * Voltear: la tarjeta apaisada y la flecha que le da la vuelta. Dibujar en su
 * lugar las dos mitades de una hoja abatiéndose sobre su eje deja un icono de
 * corchetes que, a 20 px y sin rótulo al lado, se confunde con el encuadre de
 * recolocar: los dos quedan reducidos a unas esquinas sueltas.
 */
export function FlipIcon() {
  return (
    <Icon>
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <path d="M6 8a6.5 6.5 0 0 1 12-1" />
      <path d="M18 3v4h-4" />
    </Icon>
  );
}

/** Recolocar: el encuadre al que vuelve la tarjeta, con su centro. */
export function RecenterIcon() {
  return (
    <Icon>
      <path d="M4 8V6a2 2 0 0 1 2-2h2" />
      <path d="M16 4h2a2 2 0 0 1 2 2v2" />
      <path d="M20 16v2a2 2 0 0 1-2 2h-2" />
      <path d="M8 20H6a2 2 0 0 1-2-2v-2" />
      <circle cx="12" cy="12" r="2.5" />
    </Icon>
  );
}

/** Los datos de contacto: la «i» de información. */
export function DetailsIcon() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 7.6v.4" />
    </Icon>
  );
}
