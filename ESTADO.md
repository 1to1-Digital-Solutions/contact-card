# Estado de la sesión — contact-card (handoff)

> **Cómo continuar tras reiniciar:** di a Claude «revisa `ESTADO.md` y continúa con el siguiente
> paso». Este fichero es la memoria entre sesiones: mantenlo corto, veraz y al día.

---

## ⏭️ SIGUIENTE PASO (lo primero al volver)

- Nada pendiente decidido: la tarjeta está completa. Lo siguiente lo marca la
  próxima tarea.

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
  botón de copiar por dato. La hoja solo lleva datos: voltear y recolocar van
  en la banda de mandos, junto a «Ver los datos», en todos los tamaños, para
  que el giro se vea al dispararlo.
- La tarjeta se voltea sin tocar los botones: dos toques rápidos sobre ella o
  sacarla de la pantalla arrastrándola (entonces se suelta sola y vuelve al
  centro por la otra cara). Las dos reglas viven en `lib/card-gestures.ts`.
- Previsualización al compartir el enlace: `app/opengraph-image.tsx` dibuja el
  anverso de la tarjeta con `ImageResponse` (1200×630, tema oscuro) a partir de
  `lib/contact.ts` y `lib/brand.ts`, y `app/twitter-image.tsx` reexporta la
  misma imagen. No hay ningún PNG en el repo.
- Cargo profesional («Desarrollador full-stack») en `lib/contact.ts`, entre el
  nombre y la empresa en las dos caras del anverso (3D, versión plana y la
  imagen de compartir), en el panel de datos, en `TITLE` de la vCard y en
  `jobTitle` del JSON-LD.
- Español e inglés, según el navegador. El idioma se negocia en el servidor
  con `Accept-Language` (`lib/i18n.ts`, sin librería) y llega resuelto en el
  primer HTML: `<html lang>`, `og:locale`, título, descripción, JSON-LD, la
  cara de la tarjeta (3D y plana) y la vCard. Los textos de interfaz viven en
  `lib/dictionary.ts`; el cargo, que es un dato, en `JOB_TITLE` de
  `lib/contact.ts`. Un botón en la cabecera cambia de idioma y deja la
  elección en una cookie (`contact-card-language`, un año, `SameSite=Lax`, sin
  datos personales) que `requestLanguage` lee antes de la cabecera: al volver,
  la tarjeta abre en el idioma que se eligió.
- 266 tests sobre la lógica pura (vCard, muelles, orientación, gestos que
  voltean la tarjeta, URL del sitio, elección de tema y de idioma), sobre el
  contraste de la paleta en los dos temas, sobre que `lib/brand.ts` no se
  desincronice de los tokens de `app/globals.css` ni del favicon
  `app/icon.svg` (este también en el encaje
  del isotipo), sobre que los dibujos de marca sigan donde `LOGO` dice, con su
  lienzo y con la tinta que se lee sobre su cara, y sobre los píxeles de la
  imagen de Open Graph (que solo pinta colores de la paleta) y sus metadatos.
  De la traducción se comprueban cinco cosas: la elección de idioma con
  cabeceras reales (varios pesos, comodín, `q=0`, ausente o rota), que esa
  elección se lea de la cabecera que manda el navegador y no de otra, que la
  preferencia recordada gane a la cabecera y que una cookie con cualquier otro
  valor caiga en la negociación normal (con los atributos que se escriben y sin
  romperse donde las cookies están prohibidas), que los dos diccionarios tengan
  las mismas claves sin nada vacío ni copiado del español, y —recorriendo el
  árbol de sintaxis de `app/` y `components/`— que no quede ningún texto escrito
  a mano en el JSX ni en un `aria-label`, `alt`, `title` o `lang`.
- Verificado en navegador real (Playwright + captura) además de
  typecheck, lint, build y tests.

## Pendiente / próximos pasos

Nada pendiente.

## Caveats y notas

- El doble toque se reconoce con los eventos de puntero y no con `dblclick`:
  ese evento es del ratón y en un móvil no llega. Su ventana es de 450 ms,
  la que dan por buena las plataformas; con menos (se probó con 320 ms) un
  dedo normal se queda fuera y el gesto parece que no existe.
- «Sacar la tarjeta de la pantalla» no exige sacarla entera: basta con que
  quede menos de un cuarto dentro. Con el dedo no se puede empujar más allá
  del borde, así que el criterio estricto sería inalcanzable en un móvil. Del
  cuarto sale el trato, y no depende del tamaño de la pantalla: la tarjeta se
  va si se la agarra por la mitad exterior de su lado, y no si se la agarra
  por el centro (ahí siempre queda media tarjeta dentro). Lo fijan dos tests
  en `lib/card-gestures.test.ts`: subir el umbral deja el gesto sin alcance.
- Un solo `pointerup` sobre la tarjeta entra varias veces en el manejador,
  una por cada malla que atraviesa el rayo. Por eso el toque se consume al
  leerlo: si no, el volteo se aplicaría más de una vez. Quien decide es
  `readTap`, que también admite el soltar sin marca de las entregas
  siguientes; el componente solo le pasa lo que ha medido.
- Un toque se mide siempre contra el mismo dedo (`pointerId`). Con dos
  apoyados sobre la tarjeta, el segundo pisa la marca del primero y, sin esa
  comprobación, levantar uno se leería como un toque del otro. El doble
  toque, en cambio, no compara dedos: en una pantalla táctil cada toque
  estrena `pointerId`.
- La paleta de marca está duplicada a propósito en `lib/brand.ts` (para
  three.js) y en `app/globals.css` (para Tailwind). Si se cambia una, hay que
  cambiar la otra: `lib/brand.test.ts` compara las dos listas y falla si dejan
  de coincidir, y comprueba que cada par de texto y fondo llega a WCAG AA en
  los dos temas. Los únicos colores escritos a mano fuera de ahí son los del
  favicon `app/icon.svg`, que es un SVG estático; el mismo test los ata a la
  paleta.
- La imagen de compartir es una sola y la página tiene dos temas: va del de
  partida, que hoy es el oscuro. No lo lleva escrito: lo lee de
  `DEFAULT_THEME`, así que si la página abriera en claro la imagen se mudaría
  con ella. Su tipografía no es la pila del sistema (una imagen no la tiene):
  usa la que trae el generador de Next, empaquetada, sin descargas.
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
- El idioma es lo único que saca a `/` del prerenderizado: leer una cabecera
  la vuelve dinámica (`ƒ` en el build, junto a `/_not-found`, que cuelga del
  mismo layout). No hay forma de negociar en un fichero estático y el texto no
  se puede corregir con un script como el color del tema. El resto de rutas
  —imagen de compartir, `robots.txt`, sitemap, favicon— siguen estáticas.
- La cookie del idioma solo se escribe al pulsar el botón, nunca con el idioma
  negociado: si se guardara ese, la cabecera del navegador dejaría de contar
  para siempre aunque quien visita la página cambiara el idioma del sistema.
- La imagen de compartir va en español (el de recurso), como va del tema de
  partida, y su `alt` con ella: describe lo que pone la imagen, así que en la
  página en inglés se emite un `og:image:alt` en español a propósito.
- El puerto 3000 es de Organízate: usa `PORT` para levantar el servidor.
