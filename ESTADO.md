# Estado de la sesión — contact-card (handoff)

> **Cómo continuar tras reiniciar:** di a Claude «revisa `ESTADO.md` y continúa con el siguiente
> paso». Este fichero es la memoria entre sesiones: mantenlo corto, veraz y al día.

---

## ⏭️ SIGUIENTE PASO (lo primero al volver)

- Imagen de Open Graph: hoy no hay ninguna, así que al compartir el enlace no
  se ve previsualización.

## Qué es contact-card

Una página con la tarjeta de contacto profesional de César Peón Lamparero en
3D: se agarra, se mueve, se gira y se le da la vuelta. Detalle de stack y de
arquitectura en `README.md`.

## Decisiones firmes

- Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4.
- three.js con React Three Fiber y drei. Vitest para los tests.
- Sin física de cuerda: la tarjeta es libre, con muelles amortiguados propios.
- Los datos de contacto salen todos de `lib/contact.ts`.
- Sin fuentes ni HDRI remotos: nada que descargar en tiempo de ejecución.
- Commits manuales: no commitear sin que se pida.

## Hecho hasta ahora

- Base de la suite de Organízate instalada (`.claude/rules/`, `.claude/agents/`, `CLAUDE.md`).
- Proyecto creado de cero y primera versión de la tarjeta funcionando:
  arrastrar, girar, voltear, recolocar, descarga de vCard, respaldo 2D sin
  WebGL, metadatos, `robots.txt`, sitemap y JSON-LD.
- Colores oficiales de marca aplicados (verde `#1f957a` y neutros antracita)
  en `lib/brand.ts`, en los tokens de `app/globals.css` y en el favicon.
- Logotipo real en el reverso (3D y versión plana) y el isotipo en el favicon,
  con los ficheros oficiales copiados del repo `landing`.
- Dos temas, oscuro (el de partida) y claro, con un botón en la cabecera. El
  tema vive en la clase de `<html>`, lo fija un script en línea antes de
  pintar (`lib/theme.ts`) y se recuerda en el navegador; de él dependen la
  página, las dos caras de la tarjeta —del mismo color— y el `theme-color`.
- Papel mate y granulado en lugar de brillante: el ruido hace de mapa de
  relieve del material en 3D y de textura (`.paper-grain`) en la versión plana.
- El reverso lleva el logotipo en verde de marca (`logo-brand.svg`) y el
  anverso, de marca de agua, el positivo o el negativo según el tema.
- En pantalla estrecha la tarjeta ocupa toda la pantalla, sin scroll, y los
  datos salen en una hoja (`<dialog>`) desde el botón «Ver los datos», con un
  botón de copiar por dato.
- 107 tests sobre la lógica pura (vCard, muelles, orientación, URL del sitio,
  elección de tema), sobre el contraste de la paleta en los dos temas, sobre
  que `lib/brand.ts` no se desincronice de los tokens de `app/globals.css` ni
  del favicon `app/icon.svg` (este también en el encaje del isotipo) y sobre
  que los dibujos de marca sigan donde `LOGO` dice, con su lienzo y con la
  tinta que se lee sobre su cara.
- Verificado en navegador real (Playwright + captura) además de
  typecheck, lint, build y tests.

## Pendiente / próximos pasos

1. Imagen de Open Graph: hoy no hay ninguna, así que al compartir el enlace no
   se ve previsualización.
2. Cargo profesional: no se ha inventado ninguno; si debe aparecer en la
   tarjeta, hay que decidirlo.

## Caveats y notas

- La paleta de marca está duplicada a propósito en `lib/brand.ts` (para
  three.js) y en `@theme` de `app/globals.css` (para Tailwind). Si se cambia
  una, hay que cambiar la otra: `lib/brand.test.ts` compara las dos listas y
  falla si dejan de coincidir, y comprueba que cada par de texto y fondo
  llega a WCAG AA. Fuera de esas dos listas hay dos colores más escritos a
  mano —el `themeColor` de `app/layout.tsx` y los del favicon
  `app/icon.svg`—, porque ni los metadatos de Next ni un SVG estático pueden
  leer `BRAND`; el mismo test los ata a la paleta.
- La marca de agua del anverso es el isotipo y no el logotipo completo: se
  probaron los dos en el navegador y el completo, al 7%, deja el subtítulo
  «< Digital Solutions >» como una mancha y repite el nombre de la empresa
  que ya está escrito arriba. Por eso `logo-positive.svg` no está copiado en
  `public/`: no lo usaría nadie (está en el repo `landing` si hace falta).
- El texto secundario claro (`inkInverseMuted`) no se mide contra `backdrop`
  a secas: las veladuras y el halo aclaran el fondo hasta `#364946` en el
  centro de la escena, que es justo donde se lee «Cargando la tarjeta…». Ese
  es el caso que fija el token, y está en el test.
- El acento vivo (`#1f957a`) no llega a AA como texto ni sobre el anverso
  claro ni sobre el fondo oscuro: para texto están `accentInk` (sobre claro) y
  `accentInkInverse` (sobre oscuro).
- La escena no usa tone mapping para que los colores salgan fieles; por eso
  las intensidades de luz parecen altas (la reflexión difusa divide por π).
  Están medidas para dejar el anverso justo por debajo del punto de quemado:
  si se tocan, hay que volver a medirlo (captura de la escena y porcentaje de
  píxeles a 255 en una zona lisa de la tarjeta).
- El fondo y el reverso son casi del mismo tono: en 3D los separa el canto
  claro y en la versión plana, un filete claro en el reverso.
- `npm audit` reporta 3 vulnerabilidades altas heredadas de `next`
  (postcss y sharp internos). No hay arreglo sin bajar Next a la v9.
- El puerto 3000 es de Organízate: usa `PORT` para levantar el servidor.
