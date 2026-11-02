# Session state — contact-card (hand-off)

> **How to resume after a restart:** tell Claude "read `ESTADO.md` and continue with the next
> step". This file is the memory between sessions: keep it short, truthful and current.

---

## ⏭️ NEXT STEP (first thing on return)

- **Bring the web card in line with the print face.** The two must be the same card, and on
  2026-11-02 the print face (`scripts/print-cards.mjs`, Spanish only for now) moved ahead
  of the web one (`components/contact-card/card-textures.ts`, `card-fallback.tsx`,
  `app/opengraph-image.tsx`). What changed there and still has to be ported:
  1. The company name line ("1TO1 DIGITAL SOLUTIONS") is gone from the front: the
     watermark and the back say it.
  2. The name is smaller (15 → 13 pt on paper) and the tagline is the main line: semibold
     italic in the brand green (`accentInk`, which the company line used to carry), on ONE
     line whose size is fitted so it spans the text area edge to edge (≈7.3 pt on paper).
  3. Each field keeps its label and value close together, with clearer air between
     fields (label-to-value 2.1 mm, step 7 mm on paper).
  4. The brand band on the left is thicker (1.6 mm on paper, against a 0.85 mm hairline on
     screen).
  5. The watermark is smaller (26 → 20 mm on paper).
  6. A soft green glow in the top-right corner (radial gradient of the brand green at
     ~0.2 opacity, like the landing's hero).
  7. The landing's type: Outfit 700 for the name, Inter for everything else
     (`print/fonts/`, OFL). The web card draws with the system stack by decision ("nothing
     remote at runtime"); self-hosting these two subsets from `public/` keeps that decision
     and makes the faces match. The divider sits halfway between the tagline and the first
     field.
  The `card-fallback` and `opengraph-image` tests pin the company name and the tagline
  on the front: update them with the change.
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
