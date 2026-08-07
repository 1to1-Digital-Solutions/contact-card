/**
 * Twitter/X necesita su propia imagen declarada: sin ella no emite
 * `twitter:image`. Es la misma que la de Open Graph, reexportada para que el
 * diseño viva en un solo sitio.
 */
export { default, alt, contentType, size } from "./opengraph-image";
