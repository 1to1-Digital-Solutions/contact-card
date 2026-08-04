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
app/                     Página, metadatos, robots y sitemap
components/contact-card/ La experiencia: escena, tarjeta, panel y respaldo 2D
components/geo/          Datos estructurados (JSON-LD)
lib/                     Datos, marca y lógica pura (con sus tests al lado)
```

Los datos de contacto viven en un único sitio, `lib/contact.ts`, y de ahí
salen la tarjeta 3D, el panel HTML, la vCard y el JSON-LD.

## Decisiones que conviene conocer

- **Las caras de la tarjeta se dibujan en un canvas 2D** en tiempo de
  ejecución (`card-textures.ts`), no son imágenes. Cambiar un dato o un
  color no obliga a reexportar ningún asset.
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

## Interacción

| Gesto                          | Resultado                      |
| ------------------------------ | ------------------------------ |
| Arrastrar la tarjeta           | Moverla (se inclina al mover)  |
| Soltar                         | Vuelve al centro con inercia   |
| Arrastrar el fondo             | Girarla; al soltar, encaja     |
| Doble clic en la tarjeta       | Darle la vuelta                |
| Botones «Ver el reverso» y «Recolocar» | Lo mismo, con teclado  |

## Pendiente

- Logotipo real de la empresa en el reverso (ahora hay un monograma provisional).
- Colores oficiales de marca (la paleta actual es un marcador de posición).

Ver `ESTADO.md` para el detalle del estado y el siguiente paso.
