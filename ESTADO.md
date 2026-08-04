# Estado de la sesión — contact-card (handoff)

> **Cómo continuar tras reiniciar:** di a Claude «revisa `ESTADO.md` y continúa con el siguiente
> paso». Este fichero es la memoria entre sesiones: mantenlo corto, veraz y al día.

---

## ⏭️ SIGUIENTE PASO (lo primero al volver)

- Sustituir el monograma provisional «1:1» del reverso por el logotipo real y
  cambiar la paleta por los colores oficiales de marca. Ambas cosas están
  fichadas como tareas y localizadas: el logo en
  `components/contact-card/card-textures.ts` (`createBackTexture`) y la paleta
  en `lib/brand.ts` + `@theme` de `app/globals.css`.

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
- 30 tests sobre la lógica pura (vCard, muelles, orientación, URL del sitio).
- Verificado en navegador real (Playwright + captura) además de
  typecheck, lint, build y tests.

## Pendiente / próximos pasos

1. Logotipo real en el reverso (tarea creada).
2. Colores oficiales de marca (tarea creada).
3. Imagen de Open Graph: hoy no hay ninguna, así que al compartir el enlace no
   se ve previsualización.
4. Cargo profesional: no se ha inventado ninguno; si debe aparecer en la
   tarjeta, hay que decidirlo.

## Caveats y notas

- La paleta de marca está duplicada a propósito en `lib/brand.ts` (para
  three.js) y en `@theme` de `app/globals.css` (para Tailwind). Si se cambia
  una, hay que cambiar la otra.
- La escena no usa tone mapping para que los colores salgan fieles; por eso
  las intensidades de luz parecen altas (la reflexión difusa divide por π).
  Si se tocan, revisar que el crema del anverso no se queme ni se agrise.
- `npm audit` reporta 3 vulnerabilidades altas heredadas de `next`
  (postcss y sharp internos). No hay arreglo sin bajar Next a la v9.
- El puerto 3000 es de Organízate: usa `PORT` para levantar el servidor.
