# CLAUDE.md — contact-card

**Qué es:** Quiero crear una tarjeta de contacto en una pagina web. Esta tarjeta quiero que este creada con three.js y que se pueda interactuar con ella. Se pueda agarrar y soltar, se pueda mover, girar, etc.
La idea es hacer algo parecido a lo que hizo vercel (enlace de referencia: https://vercel.com/blog/building-an-interactive-3d-event-badge-with-react-three-fiber). En lugar de tener una cuerda que poder colgarte, lo que parece una tarjeta de visita de un evento, quiero que tenga la estetica e interaccion de una tarjeta de contacto tipica de cuando se hacen eventos de networking pero con mis datos profesionales. 
Nombre: César Peón Lamparero
Email: cesarpl@1to1digital.solutions
Telefono: +34 685 399 864
Web: 1to1digital.solutions

Que ademas salga el logo de la empresa en la parte de atras de la tarjeta (si no lo tienes, crea una tarea par añadir el logo y lo hare mas adelante). Los colores de la marca igual, si no los tienes, crea una tarea para que los añada.

Mientras, ve creando el proyecto de cero con toda la estructura necesaria para poder ir creando esta tarjeta de contacto

**Cómo se construye:** sigue las reglas de `.claude/rules/` (arquitectura, seguridad, diseño,
git) en cada cambio. Lee primero el contexto del repo, haz el cambio mínimo y enfocado, reutiliza
antes de crear y verifica (typecheck/lint/build/tests) antes de dar nada por terminado.

**Estado y siguiente paso:** ver **`ESTADO.md`** — ese fichero es el handoff entre sesiones e
indica qué toca hacer ahora.

**Decisiones firmes:**
- Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4. Sin base de datos: todo el
  contenido es estático y sale de `lib/contact.ts`.
- three.js con React Three Fiber y drei para la escena; Vitest para los tests.
- La tarjeta es libre (sin física de cuerda, a diferencia de la referencia de Vercel): se mueve
  con los muelles amortiguados de `lib/motion.ts`.
- Nada remoto en tiempo de ejecución: ni fuentes, ni HDRI, ni imágenes de las caras (se dibujan
  en un canvas 2D).
- La página funciona sin WebGL: siempre hay una versión plana con los mismos datos.
- Commits manuales: no commitear sin que se pida.

> Base instalada con la suite de Organízate. Las reglas comunes viven en `.claude/rules/`. La provenance de lo
> instalado está en `.organizate/install-state.json`.
