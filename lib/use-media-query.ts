import { useCallback, useSyncExternalStore } from "react";

/**
 * Hay ratón: el puntero es fino y se mueve solo, sin tocar la pantalla. De
 * ello dependen los gestos que siguen al cursor, que en una pantalla táctil se
 * quedarían fijos en el último sitio que se tocó.
 */
export const FINE_POINTER = "(pointer: fine)";

/**
 * Móvil apaisado: sobra ancho y falta alto. Es la misma consulta que la
 * variante `phone-landscape` de `app/globals.css` —el CSS y la escena tienen
 * que repartirse la pantalla con el mismo criterio, y `use-media-query.test.ts`
 * compara las dos—, y se corta por debajo de `lg` para no alcanzar a un
 * escritorio con la ventana baja, donde el panel de datos sigue al lado.
 */
export const PHONE_LANDSCAPE =
  "(orientation: landscape) and (max-height: 32rem) and (max-width: 63.99rem)";

/**
 * `true` si la consulta de medios se cumple en este navegador, y se vuelve a
 * mirar cuando deja de cumplirse (girar el móvil, cambiar la preferencia del
 * sistema, mover la ventana a otra pantalla).
 *
 * En el servidor devuelve `false` para que el primer render coincida con el
 * del cliente antes de hidratar; el valor real llega en cuanto hay `window`.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
