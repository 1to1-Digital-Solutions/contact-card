import { useMediaQuery } from "./use-media-query";

const QUERY = "(prefers-reduced-motion: reduce)";

/** `true` si el sistema pide reducir el movimiento. */
export function useReducedMotion(): boolean {
  return useMediaQuery(QUERY);
}
