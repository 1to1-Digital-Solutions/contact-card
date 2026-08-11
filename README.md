# contact-card

Tarjeta de contacto de César Peón Lamparero (1to1 Digital Solutions) en 3D:
se agarra, se mueve, se gira y se le da la vuelta, como una tarjeta de papel
en un evento de networking.

## Cómo se ejecuta

```bash
npm install
npm run dev      # http://localhost:3000 (usa PORT para cambiarlo)
```

| Comando             | Para qué                          |
| ------------------- | --------------------------------- |
| `npm run dev`       | Servidor de desarrollo            |
| `npm run build`     | Compilación de producción         |
| `npm run typecheck` | Tipos (`tsc --noEmit`)            |
| `npm run lint`      | ESLint                            |
| `npm test`          | Tests (Vitest)                    |

Variables de entorno: ver `.env.example`. Solo hay una, `NEXT_PUBLIC_SITE_URL`,
y es opcional.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 ·
three.js con React Three Fiber y drei · Vitest.

## Cómo está montado

```
app/                     Página, metadatos, imagen de compartir, robots y sitemap
components/contact-card/ La experiencia: escena, tarjeta, panel y respaldo 2D
components/geo/          Datos estructurados (JSON-LD)
lib/                     Datos, marca y lógica pura (con sus tests al lado)
```

Los datos de contacto viven en un único sitio, `lib/contact.ts`, y de ahí
salen la tarjeta 3D, el panel HTML, la vCard y el JSON-LD. Los textos de la
interfaz, en otro: `lib/dictionary.ts`.

## Decisiones que conviene conocer

- **Español e inglés, según el navegador**: el idioma se negocia en el
  servidor con `Accept-Language` (`lib/i18n.ts`), sin librería de i18n, y
  español es el recurso cuando no hay coincidencia. Viaja resuelto en el
  primer HTML —a diferencia del tema, un script no puede corregirlo después—,
  así que `/` se renderiza en cada visita; el resto (imagen de compartir,
  `robots.txt`, sitemap) se sigue generando en build. El botón de la cabecera
  cambia de idioma, pensado para enseñar la tarjeta a alguien que no lee el
  tuyo, y esa elección se recuerda en una cookie que el servidor lee antes de
  escribir el texto (`lib/request-language.ts`); manda sobre la cabecera, y si
  trae cualquier otro valor se ignora y se negocia como siempre.

- **Las caras de la tarjeta se dibujan en un canvas 2D** en tiempo de
  ejecución (`card-textures.ts`), no son imágenes. Cambiar un dato o un
  color no obliga a reexportar ningún asset. La excepción son los logotipos,
  que son los SVG oficiales de la marca (`public/logo-brand.svg` en el
  reverso; el positivo o el negativo de marca de agua en el anverso): como hay
  que esperar a que carguen, la cara se dibuja sin ellos y se refresca en
  cuanto están.
- **Dos temas, y los elige el botón, no el sistema**: el tema vive en la clase
  de `<html>` y un script en línea lo fija antes del primer pintado
  (`lib/theme.ts`). De él dependen la página y el color de las dos caras de la
  tarjeta, que van iguales.
- **Sin fuentes remotas**: se usa la pila tipográfica del sistema, tanto en
  la interfaz como dentro de la tarjeta, para que ambas coincidan y no haya
  descargas.
- **Sin física de cuerda** (a diferencia de la referencia de Vercel): la
  tarjeta se mueve con muelles amortiguados propios (`lib/motion.ts`), que
  son código puro y con tests.
- **Sin sombra proyectada**: la tarjeta flota sobre un degradado, no sobre
  una pared; el volumen lo dan el bisel, las luces y el mapa de entorno.
- **Todo funciona sin WebGL**: si el navegador no puede con 3D, se enseña la
  misma tarjeta en CSS. Los datos, además, están siempre en HTML.
- **Compartir va por el diálogo del sistema** (`navigator.share`), que es el
  camino bueno en un móvil; donde no existe se copia el enlace, con el mismo
  aviso que los botones de copiar. Lo que se manda es el título de la tarjeta
  en el idioma que se esté viendo y la dirección canónica del sitio, no la de
  la barra del navegador (`lib/share.ts`).
- **La previsualización al compartir también se genera desde el código**
  (`app/opengraph-image.tsx`, con `ImageResponse`): mismos datos y misma
  paleta que la tarjeta, así que no hay ningún PNG que reexportar. Twitter/X
  reutiliza esa misma imagen. Va en un solo idioma —el único texto suyo que se
  traduce es el cargo— porque quien la pide es el servicio de mensajería, que
  no manda el idioma de nadie y cachea una imagen por URL para todos.

## Interacción

| Gesto                          | Resultado                      |
| ------------------------------ | ------------------------------ |
| Arrastrar la tarjeta           | Moverla (se inclina al mover)  |
| Soltar                         | Vuelve al centro con inercia   |
| Arrastrar el fondo             | Girarla; al soltar, encaja     |
| Doble clic en la tarjeta       | Darle la vuelta                |
| Botones «Ver el reverso» y «Recolocar» | Lo mismo, con teclado  |
| Botón «sol/luna» de la cabecera | Cambiar entre tema claro y oscuro |
| Botón «ES/EN» de la cabecera   | Cambiar de idioma; se recuerda |
| «Ver los datos» (móvil)        | Abre la hoja con los datos, copiar y guardar |
| «Compartir»                    | Diálogo del sistema; donde no lo hay, copia el enlace |
| Mover el ratón por la página   | La tarjeta se asoma hacia el puntero, sin moverse del sitio |

Al abrir la página la tarjeta cae desde fuera de la pantalla y se balancea una
vez, para que se vea que se puede coger (`lib/card-intro.ts`). El balanceo se
corta con el primer gesto y no vuelve. Quien pide menos movimiento se encuentra
la tarjeta ya colocada y quieta, y sin el asomo hacia el puntero.

En pantalla estrecha la tarjeta ocupa toda la pantalla y no hay scroll: los
datos viven en esa hoja. A partir de `lg` están siempre a la vista en el panel
lateral.

Ver `ESTADO.md` para el detalle del estado y el siguiente paso.
