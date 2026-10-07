/**
 * Twitter/X needs its own image declared: without it, it does not emit
 * `twitter:image`. It is the same as the Open Graph one, re-exported so the
 * design lives in a single place.
 */
export { default, alt, contentType, size } from "./opengraph-image";
