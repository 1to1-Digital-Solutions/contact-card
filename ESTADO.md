# Session state — contact-card (hand-off)

> **How to resume after a restart:** tell Claude "read `ESTADO.md` and continue with the next
> step". This file is the memory between sessions: keep it short, truthful and current.

---

## ⏭️ NEXT STEP (first thing on return)

- Nothing pending: the card is complete and ready to be published. The next task sets what
  comes next.

## What contact-card is

A page with the professional contact card of César Peón Lamparero in 3D: grab it, move it,
spin it and flip it over. Stack, layout and design decisions are in `README.md`; the
reasoning behind each piece lives next to the code, in its comments and tests.

## Firm decisions

- Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4.
- three.js through React Three Fiber and drei. Vitest for unit tests, Playwright for e2e.
- No lanyard physics: the card is free, on damped springs of our own (`lib/motion.ts`).
- All contact details come from `lib/contact.ts`; all interface copy from `lib/dictionary.ts`.
- No remote fonts or HDRI: nothing to download at runtime.
- Manual commits: never commit unless asked to.

## How to run it

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # unit tests (Vitest)
npm run test:e2e   # end-to-end (Playwright; builds the site and starts it on port 3220)
```

The gates before anything is done: `npm run lint`, `npm run typecheck`, `npm test`,
`npm run build`, `npm run test:e2e`.

## Caveats worth knowing

- The brand palette is duplicated on purpose in `lib/brand.ts` (for three.js) and in
  `app/globals.css` (for Tailwind). `lib/brand.test.ts` compares both and checks contrast;
  change one, change the other.
- The Content Security Policy carries a per-request nonce set in `proxy.ts`; the layout reads
  it back for the inline theme script. Adding another inline script means passing it the nonce.
- Deployed on Vercel at https://card.1to1digital.solutions. `NEXT_PUBLIC_SITE_URL` is set
  there; locally it is optional (`.env.example`).
