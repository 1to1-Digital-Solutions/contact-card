import { useCallback, useSyncExternalStore } from "react";

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
