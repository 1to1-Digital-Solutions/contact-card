import { useMediaQuery } from "./use-media-query";

const QUERY = "(prefers-reduced-motion: reduce)";

/** `true` if the system asks for reduced motion. */
export function useReducedMotion(): boolean {
  return useMediaQuery(QUERY);
}
