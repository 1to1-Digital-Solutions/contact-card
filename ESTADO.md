# Session state — contact-card (hand-off)

> **How to resume after a restart:** tell Claude "read `ESTADO.md` and continue with the next
> step". This file is the memory between sessions: keep it short, truthful and current.

---

## ⏭️ NEXT STEP (first thing on return)

- Nothing pending. The web card was brought in line with the printed one on 2026-11-02
  (see below) and published the same day.
- Done on 2026-11-02 (afternoon): the front of the web card —3D face, flat card and share
  image— now follows the printed face (`scripts/print-cards.mjs`) millimetre by millimetre:
  no company line (the watermark and the back say it), Outfit 700 for the name, the tagline
  as the main line in semibold italic brand green fitted to one full-width line, labels
  clearly smaller than values with air between fields, a 1.6 mm brand band, a smaller
  watermark and a soft green glow top-right. Inter and Outfit are self-hosted from
  `public/fonts/` and the whole page is set in Inter, like the landing. The share image
  keeps the generator's default type: it takes TTF/OTF and only the WOFF2 subsets ship.
- Done on 2026-11-02: the card got its definitive tagline («Entiende e integra la
  IA en tu negocio de forma segura» / «Understand and integrate AI into your business safely»)
  and the LinkedIn profile as a fourth field on the face; the print-ready files in
  `print/out/` (`npm run print:cards`) were regenerated with it. Next.js went to 16.4.3 (three
  critical advisories on 16.4.0 made `next build` stop).

## What contact-card is

A page with the professional contact card of César Peón Lamparero in 3D: grab it, move it,
spin it and flip it over. Stack, layout and design decisions are in `README.md`; the
reasoning behind each piece lives next to the code, in its comments and tests.

## Firm decisions

- Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4.
- three.js through React Three Fiber and drei. Vitest for unit tests, Playwright for e2e.
- No lanyard physics: the card is free, on damped springs of our own (`lib/motion.ts`).
- All contact details come from `lib/contact.ts`; all interface copy from `lib/dictionary.ts`.
- Nothing remote at runtime: the type (Inter, Outfit) is self-hosted from `public/fonts/`.
- The web card and the printed one are the same card, laid out in the same millimetres.
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
