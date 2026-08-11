/**
 * Compartir la tarjeta: qué se manda y por dónde.
 *
 * El camino bueno es el diálogo del sistema (`navigator.share`), que en un
 * móvil ofrece las aplicaciones que ya usa quien comparte. Donde no existe
 * —el escritorio, casi siempre— queda copiar el enlace, que es lo que se
 * estaba haciendo a mano en la barra del navegador. La elección vive aquí,
 * separada del botón, para poder probarla sin navegador.
 */

import { CONTACT } from "./contact";
import { dictionary } from "./dictionary";
import type { Language } from "./i18n";
import { SITE_URL } from "./site";

/** Lo que se comparte: el título de la tarjeta y su dirección. */
export type ShareTarget = {
  title: string;
  url: string;
};

/**
 * En qué acabó el intento:
 * - `shared`: lo recogió el diálogo del sistema.
 * - `dismissed`: se abrió el diálogo y se cerró sin compartir.
 * - `copied`: no había diálogo (o no pudo abrirse) y el enlace está copiado.
 * - `failed`: tampoco se pudo copiar; es lo único que hay que contar.
 */
export type ShareOutcome = "shared" | "dismissed" | "copied" | "failed";

/** Lo que el navegador pone para compartir, inyectado para poder probarlo. */
export type ShareTools = {
  /** `navigator.share`, o nada si el navegador no lo trae. */
  share?: (target: ShareTarget) => Promise<void>;
  /** `navigator.clipboard.writeText`: el camino de los botones de copiar. */
  copy: (text: string) => Promise<void>;
  /** Dónde se cuenta lo que falla: un error tragado no se arregla nunca. */
  warn: (error: unknown) => void;
};

/**
 * Lo que se comparte, en el idioma que se está viendo. La dirección es la
 * canónica del sitio y no `location.href`: quien recibe el enlace tiene que
 * llegar a la tarjeta, no a la ruta con los parámetros con los que se llegó
 * a ella.
 */
export function shareTarget(language: Language): ShareTarget {
  return { title: dictionary(language).meta.title(CONTACT.name), url: SITE_URL };
}

/**
 * Cerrar el diálogo del sistema sin compartir llega como un `AbortError`. Eso
 * no es un fallo: es alguien que se ha arrepentido, y enseñarle un aviso de
 * error sería contarle que se ha roto algo que funciona.
 */
function isDismissal(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

/**
 * Comparte la tarjeta por el mejor camino disponible. Si el diálogo del
 * sistema no existe, o existe pero revienta al abrirse, se cae en copiar el
 * enlace: el botón nunca se queda sin hacer nada.
 */
export async function shareCard(
  target: ShareTarget,
  { share, copy, warn }: ShareTools,
): Promise<ShareOutcome> {
  if (share) {
    try {
      await share(target);
      return "shared";
    } catch (error) {
      if (isDismissal(error)) return "dismissed";
      warn(error);
    }
  }

  try {
    await copy(target.url);
    return "copied";
  } catch (error) {
    warn(error);
    return "failed";
  }
}

/**
 * Qué aviso deja cada final, o ninguno. Compartir de verdad no lleva aviso
 * —el propio diálogo del sistema ya lo es— y cancelarlo tampoco: quien se
 * arrepiente no ha roto nada, y enseñarle un error le contaría lo contrario.
 *
 * Va en la tabla y no en un par de `if` dentro del botón porque el tipo obliga
 * a decidirlo para cada final: un camino nuevo en `ShareOutcome` no puede
 * colarse sin que alguien diga qué se le cuenta a quien pulsa.
 */
const FEEDBACK: Record<ShareOutcome, "done" | "failed" | null> = {
  shared: null,
  dismissed: null,
  copied: "done",
  failed: "failed",
};

/** El aviso pasajero del botón para este final, o `null` si no toca ninguno. */
export function shareFeedback(outcome: ShareOutcome): "done" | "failed" | null {
  return FEEDBACK[outcome];
}
