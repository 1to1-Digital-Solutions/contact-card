import { useCallback, useSyncExternalStore } from "react";

/**
 * There is a mouse: the pointer is fine and moves on its own, without
 * touching the screen. The gestures that follow the cursor depend on it; on a
 * touch screen they would stay stuck at the last spot that was touched.
 */
export const FINE_POINTER = "(pointer: fine)";

/**
 * Phone in landscape: width to spare and height lacking. It is the same query
 * as the `phone-landscape` variant in `app/globals.css` —the CSS and the scene
 * have to split the screen by the same criterion, and `use-media-query.test.ts`
 * compares the two—, and it cuts off below `lg` so as not to reach a desktop
 * with a short window, where the data panel still sits alongside.
 */
export const PHONE_LANDSCAPE =
  "(orientation: landscape) and (max-height: 32rem) and (max-width: 63.99rem)";

/**
 * `true` if the media query holds in this browser, and it is checked again
 * when it stops holding (rotating the phone, changing the system preference,
 * moving the window to another screen).
 *
 * On the server it returns `false` so the first render matches the client's
 * before hydrating; the real value arrives as soon as there is a `window`.
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
