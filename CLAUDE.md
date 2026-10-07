# CLAUDE.md — contact-card

**What it is:** a web page with the professional contact card of César Peón Lamparero
(1to1 Digital Solutions) in 3D. It behaves like a paper business card handed over at a
networking event: you grab it, move it, spin it and flip it over, and you can save the
details to your address book. Reference for the idea: Vercel's interactive 3D event badge
(https://vercel.com/blog/building-an-interactive-3d-event-badge-with-react-three-fiber),
without the lanyard. The details themselves live in `lib/contact.ts`.

**How it is built:** follow the rules in `.claude/rules/` (architecture, security, design,
git) on every change. Read the repo's context first, make the smallest focused change, reuse
before creating, and verify (typecheck, lint, build, unit and e2e tests) before calling
anything done. `README.md` explains the stack, the layout and the design decisions.

**State and next step:** see **`ESTADO.md`**, the hand-off between sessions.

**Firm decisions:**
- Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4. No database: all the
  content is static and comes from `lib/contact.ts`.
- three.js through React Three Fiber and drei for the scene; Vitest for unit tests,
  Playwright for end-to-end tests.
- The card is free (no lanyard physics, unlike Vercel's reference): it moves on the damped
  springs in `lib/motion.ts`.
- Nothing remote at runtime: no fonts, no HDRI, no images for the faces (they are drawn on
  a 2D canvas).
- The page works without WebGL: there is always a flat version with the same details.
- Manual commits: never commit unless asked to.

> Base installed with the Organízate suite. The shared rules live in `.claude/rules/`; the
> provenance of what was installed is in `.organizate/install-state.json`.
