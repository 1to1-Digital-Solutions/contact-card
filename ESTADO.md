# Estado de la sesión — contact-card (handoff)

> **Cómo continuar tras reiniciar:** di a Claude «revisa `ESTADO.md` y continúa con el siguiente
> paso». Este fichero es la memoria entre sesiones: mantenlo corto, veraz y al día.

---

## ⏭️ SIGUIENTE PASO (lo primero al volver)

- Cargo profesional: no se ha inventado ninguno; si debe aparecer en la
  tarjeta, hay que decidirlo.

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
- Previsualización al compartir el enlace: `app/opengraph-image.tsx` dibuja el
  anverso de la tarjeta con `ImageResponse` (1200×630, tema oscuro) a partir de
  `lib/contact.ts` y `lib/brand.ts`, y `app/twitter-image.tsx` reexporta la
  misma imagen. No hay ningún PNG en el repo.
- 132 tests sobre la lógica pura (vCard, muelles, orientación, URL del sitio,
  elección de tema), sobre el contraste de la paleta en los dos temas, sobre
  que `lib/brand.ts` no se desincronice de los tokens de `app/globals.css` ni
  del favicon `app/icon.svg` (este también en el encaje del isotipo), sobre
  que los dibujos de marca sigan donde `LOGO` dice, con su lienzo y con la
  tinta que se lee sobre su cara, y sobre los píxeles de la imagen de
  Open Graph (que solo pinta colores de la paleta) y sus metadatos.
- Verificado en navegador real (Playwright + captura) además de
  typecheck, lint, build y tests.

## Pendiente / próximos pasos

1. Cargo profesional: no se ha inventado ninguno; si debe aparecer en la
   tarjeta, hay que decidirlo.

## Caveats y notas

- La paleta de marca está duplicada a propósito en `lib/brand.ts` (para
  three.js) y en `app/globals.css` (para Tailwind). Si se cambia una, hay que
  cambiar la otra: `lib/brand.test.ts` compara las dos listas y falla si dejan
  de coincidir, y comprueba que cada par de texto y fondo llega a WCAG AA en
  los dos temas. Los únicos colores escritos a mano fuera de ahí son los del
  favicon `app/icon.svg`, que es un SVG estático; el mismo test los ata a la
  paleta.
- La imagen de compartir es una sola y la página tiene dos temas: va del
  oscuro, que es el de partida. Su tipografía no es la pila del sistema (una
  imagen no la tiene): usa la que trae el generador de Next, empaquetada, sin
  descargas.
- El `theme-color` de la pestaña no se declara por `prefers-color-scheme`: el
  tema lo elige el botón, no el sistema. Los metadatos salen con el color del
  tema de partida y lo corrigen el script en línea (al cargar) y `applyTheme`
  (al pulsar el botón).
- El texto secundario (`inkMuted`) no se mide contra `backdrop` a secas: la
  veladura y el halo mueven el fondo justo donde se lee «Cargando la
  tarjeta…». Ese es el caso que fija el token, y el test lee las opacidades
  del propio CSS para rehacer la cuenta.
- El acento vivo (`#1f957a`) no llega a AA como texto sobre ninguna de las dos
  caras: para texto está `accentInk`, que cambia con el tema (primary-200
  sobre oscuro, primary-500 sobre claro).
- La escena no usa tone mapping para que los colores salgan fieles; por eso
  las intensidades de luz parecen altas (la reflexión difusa divide por π).
  Están medidas para dejar el anverso justo por debajo del punto de quemado:
  si se tocan, hay que volver a medirlo (captura de la escena y porcentaje de
  píxeles a 255 en una zona lisa de la tarjeta).
- La tarjeta y el fondo son casi del mismo tono en los dos temas, y el canto
  va a un paso del color de la cara (si se separa más, las esquinas
  redondeadas vuelven a verse encendidas, que era la queja). Lo que separa la
  tarjeta del fondo es el halo de `.card-halo` —claro sobre oscuro, sombra
  sobre claro— más las luces de la escena.
- `npm audit` reporta 3 vulnerabilidades altas heredadas de `next`
  (postcss y sharp internos). No hay arreglo sin bajar Next a la v9.
- El puerto 3000 es de Organízate: usa `PORT` para levantar el servidor.
