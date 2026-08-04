# Estado de la sesión — contact-card (handoff)

> **Cómo continuar tras reiniciar:** di a Claude «revisa `ESTADO.md` y continúa con el siguiente
> paso». Este fichero es la memoria entre sesiones: mantenlo corto, veraz y al día.

---

## ⏭️ SIGUIENTE PASO (lo primero al volver)

- Sustituir el monograma provisional «1:1» del reverso por el logotipo real.
  Está fichado como tarea y localizado en
  `components/contact-card/card-textures.ts` (`createBackTexture`).

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
  en `lib/brand.ts`, `@theme`, favicon y `themeColor`.
- 64 tests sobre la lógica pura (vCard, muelles, orientación, URL del sitio),
  sobre el contraste de la paleta y sobre que `lib/brand.ts` y el `@theme` de
  `app/globals.css` no se desincronicen.
- Verificado en navegador real (Playwright + captura) además de
  typecheck, lint, build y tests.

## Pendiente / próximos pasos

1. Logotipo real en el reverso (tarea creada).
2. Imagen de Open Graph: hoy no hay ninguna, así que al compartir el enlace no
   se ve previsualización.
3. Cargo profesional: no se ha inventado ninguno; si debe aparecer en la
   tarjeta, hay que decidirlo.

## Caveats y notas

- La paleta de marca está duplicada a propósito en `lib/brand.ts` (para
  three.js) y en `@theme` de `app/globals.css` (para Tailwind). Si se cambia
  una, hay que cambiar la otra: `lib/brand.test.ts` compara las dos listas y
  falla si dejan de coincidir, y comprueba que cada par de texto y fondo
  llega a WCAG AA.
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
