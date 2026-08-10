/**
 * Los idiomas en los que se sirve la tarjeta y cómo se elige uno.
 *
 * La elección se hace en el servidor, con la cabecera `Accept-Language`: el
 * idioma tiene que venir bien en el primer HTML. Con el tema basta un script
 * en línea que corrija una clase antes de pintar; con el texto no hay
 * equivalente, porque el texto ya está escrito cuando el script corre.
 *
 * Sin librería de i18n a propósito: son dos idiomas y una pantalla, y todo lo
 * que hace falta es negociar la cabecera y buscar en un objeto.
 */

export const LANGUAGES = ["es", "en"] as const;

export type Language = (typeof LANGUAGES)[number];

/** Idioma de recurso: el que se sirve cuando el navegador no pide ninguno de los dos. */
export const DEFAULT_LANGUAGE: Language = "es";

/**
 * Dónde se recuerda el idioma elegido en el conmutador. Va en una cookie y no
 * en el almacenamiento del navegador porque quien tiene que leerlo es el
 * servidor, antes de escribir el texto: cuando corriera un script ya sería
 * tarde. Es una preferencia funcional —no identifica a nadie ni se comparte—,
 * así que no pide consentimiento.
 */
export const LANGUAGE_COOKIE = "contact-card-language";

/** El `locale` de Open Graph, que lleva región y guion bajo. */
export const OG_LOCALE: Record<Language, string> = {
  es: "es_ES",
  en: "en_US",
};

function isLanguage(value: string): value is Language {
  return (LANGUAGES as readonly string[]).includes(value);
}

/**
 * El idioma guardado en una preferencia, o `null` si no es uno de los que
 * servimos. Devuelve `null` en lugar del idioma de recurso a propósito: quien
 * lee la preferencia tiene que poder distinguir «pidió español» de «aquí no
 * hay nada que valga» para caer entonces en la negociación con el navegador.
 */
export function parseLanguage(value: string | null | undefined): Language | null {
  return value && isLanguage(value) ? value : null;
}

/** El siguiente idioma de la lista, en círculo: el que ofrece el conmutador. */
export function nextLanguage(language: Language): Language {
  return LANGUAGES[(LANGUAGES.indexOf(language) + 1) % LANGUAGES.length];
}

type Preference = { language: Language; quality: number };

/**
 * El peso de una entrada de `Accept-Language`. Vale 1 si no lo trae, que es lo
 * que dice el RFC 9110 §12.4.2. Si lo trae pero no es un número entre 0 y 1,
 * devuelve `null` para descartar la entrada: una cabecera malformada no debe
 * colarse por delante de las que sí están bien.
 */
function parseQuality(params: string[]): number | null {
  const param = params
    .map((value) => value.replace(/\s/g, "").toLowerCase())
    .find((value) => value.startsWith("q="));
  if (!param) return 1;

  const quality = Number(param.slice("q=".length));
  if (!Number.isFinite(quality) || quality < 0 || quality > 1) return null;
  return quality;
}

/**
 * Una entrada de la cabecera (`es-ES;q=0.8`) convertida en preferencia, o
 * `null` si no cuenta: un idioma que no servimos, un `q=0` —que es como el
 * navegador rechaza un idioma— o un peso malformado.
 */
function parsePreference(entry: string): Preference | null {
  const [rawTag, ...params] = entry.split(";");
  const tag = rawTag.trim().toLowerCase();
  if (!tag) return null;

  const quality = parseQuality(params);
  if (quality === null || quality === 0) return null;

  // `*` es «cualquiera me vale»: se resuelve con el idioma de recurso.
  if (tag === "*") return { language: DEFAULT_LANGUAGE, quality };

  // `en-GB` y `en` piden el mismo idioma: solo cuenta el subtag primario.
  const primary = tag.split("-")[0];
  return isLanguage(primary) ? { language: primary, quality } : null;
}

/**
 * El idioma que se sirve para una cabecera `Accept-Language`. Si no hay
 * cabecera, o ninguna de sus entradas pide un idioma que tengamos, cae en el
 * de recurso.
 */
export function pickLanguage(acceptLanguage: string | null | undefined): Language {
  if (!acceptLanguage) return DEFAULT_LANGUAGE;

  const preferences = acceptLanguage
    .split(",")
    .map(parsePreference)
    .filter((preference): preference is Preference => preference !== null)
    // `sort` es estable, así que a igualdad de peso gana la entrada que el
    // navegador puso antes, que es justo el orden que quiso expresar.
    .sort((a, b) => b.quality - a.quality);

  return preferences[0]?.language ?? DEFAULT_LANGUAGE;
}

/**
 * Deja el idioma elegido en el documento cuando lo cambia el conmutador. El
 * `lang` de `<html>` no es decorativo: de él dependen cómo pronuncia el texto
 * un lector de pantalla y cómo lo parte el navegador. El título de la pestaña
 * se pintó en el servidor con el idioma negociado, así que también se corrige.
 */
export function applyLanguage(language: Language, title: string): void {
  document.documentElement.lang = language;
  document.title = title;
}

/** Un año desde la última vez que se pulsa el conmutador, que es cuando se reescribe. */
const LANGUAGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Recuerda para las próximas visitas el idioma que se acaba de elegir.
 *
 * Solo se escribe al pulsar el conmutador, nunca con el idioma negociado: si
 * se guardara también ese, la cabecera del navegador dejaría de contar aunque
 * quien visita la página cambiara el idioma de su sistema.
 */
export function rememberLanguage(language: Language): void {
  try {
    // Sin `Secure` fuera de HTTPS: en desarrollo la cookie no llegaría a
    // escribirse y la preferencia se perdería justo donde se prueba.
    const secure = location.protocol === "https:" ? ";Secure" : "";
    document.cookie = `${LANGUAGE_COOKIE}=${language};Path=/;Max-Age=${LANGUAGE_COOKIE_MAX_AGE};SameSite=Lax${secure}`;
  } catch (error) {
    // Como con el tema: el idioma cambia igual en la página, lo único que se
    // pierde es recordarlo. Escribir cookies revienta donde están prohibidas
    // —un `iframe` en cajón de arena, por ejemplo—, y el conmutador no puede
    // llevarse por delante el clic por eso.
    console.warn("No se ha podido recordar el idioma elegido:", error);
  }
}
