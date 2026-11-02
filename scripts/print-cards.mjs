/**
 * Print-ready files for the physical card.
 *
 * It draws the two faces of the web card in HTML, with the same data
 * (`lib/contact.ts`), palette and logos (`lib/brand.ts`), and prints them
 * with Chromium to PDF at the European card size, 85 × 55 mm, plus 2 mm of
 * bleed on every side (89 × 59 mm, no crop marks: that is the canvas the
 * online printers' editors show, so the file goes in without stretching).
 * The text is set a little larger than on screen: the web card is viewed at
 * twice its real size, and the smallest labels there would come out under
 * 4 pt on paper.
 *
 *   npm run print:cards            # writes print/out/*.pdf and *.png, both languages
 *   npm run print:cards -- es      # one language only
 *
 * Upload the PDF: it is vector and keeps the text sharp at any size. The PNG
 * is a 600 dpi preview of the same page, to check by eye.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "print", "out");

const { BRAND, LOGO, THEMES, WATERMARK } = await import("../lib/brand.ts");
const { contactIn, PROFILES } = await import("../lib/contact.ts");
const { dictionary } = await import("../lib/dictionary.ts");
const { LANGUAGES } = await import("../lib/i18n.ts");

/** Languages to produce: the ones given on the command line, or all of them. */
const wanted = process.argv.slice(2).filter((a) => !a.startsWith("-"));
const languages = wanted.length ? wanted : [...LANGUAGES];
for (const language of languages) {
  if (!LANGUAGES.includes(language)) {
    console.error(`unknown language "${language}"; use one of: ${LANGUAGES.join(", ")}`);
    process.exit(1);
  }
}

const THEME = "dark";
const PALETTE = THEMES[THEME];

/** Trim size and bleed, in mm. */
const TRIM = { width: 85, height: 55 };
const BLEED = 2;
const PAGE = { width: TRIM.width + 2 * BLEED, height: TRIM.height + 2 * BLEED };
/** Inner margin of the web card (150 of 2048 px), on paper. */
const PAD = 6.2;

const FONT_STACK = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

async function svgDataUri(file) {
  const svg = await readFile(path.join(ROOT, "public", file), "utf8");
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function page(body) {
  return `<!doctype html>
<html><head><meta charset="utf-8">
<style>
  @page { size: ${PAGE.width}mm ${PAGE.height}mm; margin: 0; }
  html, body { margin: 0; padding: 0; }
  body { font-family: ${FONT_STACK}; -webkit-font-smoothing: antialiased; }
  .page {
    position: relative; overflow: hidden;
    width: ${PAGE.width}mm; height: ${PAGE.height}mm;
    background: ${PALETTE.card}; color: ${PALETTE.ink};
    page-break-after: always;
  }
  /* Everything is placed from the trim box, not from the bleed edge. */
  .trim { position: absolute; left: ${BLEED}mm; top: ${BLEED}mm; width: ${TRIM.width}mm; height: ${TRIM.height}mm; }
  .abs { position: absolute; white-space: nowrap; line-height: 1; }
  .muted { color: ${PALETTE.inkMuted}; }
  .accent { color: ${PALETTE.accentInk}; }
  .caps { text-transform: uppercase; }
</style></head><body>${body}</body></html>`;
}

function front(contact, labels, watermark) {
  // Each field is a label and its value, close together so they read as one
  // thing, with clear air before the next field: the gap inside a field is
  // smaller than the gap between fields.
  const LABEL_TO_VALUE = 2.1;
  const field = (y, label, value) => `
    <div class="abs muted caps" style="left:${PAD}mm; top:${y}mm; font-size:5.2pt; font-weight:600; letter-spacing:0.18em">${label}</div>
    <div class="abs" style="left:${PAD}mm; top:${y + LABEL_TO_VALUE}mm; font-size:7.5pt">${value}</div>`;
  // Four fields anchored to the bottom margin, like the web face.
  const STEP = 6.4;
  const FIRST = TRIM.height - PAD - 2.9 - LABEL_TO_VALUE - 3 * STEP;
  const [linkedIn] = PROFILES;
  const wmWidth = 20;
  const wmHeight = (wmWidth * WATERMARK[THEME].height) / WATERMARK[THEME].width;

  // The band on the left edge, into the bleed: 1.6 mm visible once trimmed.
  // Thicker than the hairline on screen on purpose: the cut can land up to
  // a millimetre inside the trim line and the band has to survive it.
  const BAND = 1.6;
  // A soft turquoise glow in the bottom-right corner, like the one behind the
  // landing's hero: a radial gradient (vector in the PDF, no raster blur) that
  // fades out well before the text, in the brand green at low opacity.
  const GLOW = 48;

  return `<div class="page">
    <div class="abs" style="right:${-GLOW * 0.42}mm; bottom:${-GLOW * 0.42}mm; width:${GLOW}mm; height:${GLOW}mm; border-radius:50%; background:radial-gradient(circle, rgba(31,149,122,0.42) 0%, rgba(31,149,122,0.18) 40%, rgba(31,149,122,0) 70%)"></div>
    <div class="abs" style="left:0; top:0; width:${BLEED + BAND}mm; height:${PAGE.height}mm; background:${BRAND.accent}"></div>
    <div class="trim">
      <div class="abs" style="left:${PAD}mm; top:7mm; font-size:15pt; font-weight:600; letter-spacing:-0.01em">${contact.name}</div>
      <div class="abs muted" style="left:${PAD}mm; top:13.2mm; font-size:7.5pt">${contact.jobTitle}</div>
      <div class="abs accent caps" style="left:${PAD}mm; top:16.5mm; font-size:6pt; font-weight:600; letter-spacing:0.28em">${contact.company}</div>
      <div class="abs muted" style="left:${PAD}mm; top:19.6mm; font-size:6.5pt">${contact.tagline}</div>
      <div class="abs" style="left:${PAD}mm; top:23.4mm; width:${TRIM.width - 2 * PAD}mm; height:0.15mm; background:${PALETTE.inkMuted}; opacity:0.3"></div>
      ${field(FIRST, labels.email, contact.email)}
      ${field(FIRST + STEP, labels.phone, contact.phone)}
      ${field(FIRST + 2 * STEP, labels.website, contact.website)}
      ${field(FIRST + 3 * STEP, linkedIn.name, linkedIn.address)}
      <img src="${watermark}" style="position:absolute; right:${PAD}mm; bottom:${PAD + 6.5}mm; width:${wmWidth}mm; height:${wmHeight}mm; opacity:0.1">
    </div>
  </div>`;
}

function back(contact, logo) {
  const logoWidth = 34;
  const logoHeight = (logoWidth * LOGO.brand.height) / LOGO.brand.width;
  return `<div class="page">
    <div class="trim">
      <img src="${logo}" style="position:absolute; left:${(TRIM.width - logoWidth) / 2}mm; top:15.4mm; width:${logoWidth}mm; height:${logoHeight}mm">
      <div class="abs muted" style="left:0; width:${TRIM.width}mm; top:38.5mm; text-align:center; font-size:6.5pt; letter-spacing:0.12em">${contact.website}</div>
      <div class="abs" style="left:${TRIM.width / 2 - 2.5}mm; top:${TRIM.height - 3.7}mm; width:5mm; height:0.17mm; background:${BRAND.accent}"></div>
    </div>
  </div>`;
}

await mkdir(OUT, { recursive: true });
const [watermark, logo] = await Promise.all([
  svgDataUri(path.basename(WATERMARK[THEME].src)),
  svgDataUri(path.basename(LOGO.brand.src)),
]);

const browser = await chromium.launch();
// 600 dpi previews: CSS millimetres render at 96 dpi, so scale the device.
const DPI = 600;
const context = await browser.newContext({
  deviceScaleFactor: DPI / 96,
  viewport: { width: Math.ceil((PAGE.width / 25.4) * 96), height: Math.ceil((PAGE.height / 25.4) * 96) },
});
const tab = await context.newPage();
const written = [];

for (const language of languages) {
  const contact = contactIn(language);
  const labels = dictionary(language).fields;
  const faces = { front: front(contact, labels, watermark), back: back(contact, logo) };

  for (const [face, html] of Object.entries(faces)) {
    await tab.setContent(page(html), { waitUntil: "load" });
    const pdf = await tab.pdf({ printBackground: true, preferCSSPageSize: true });
    const base = path.join(OUT, `card-${language}-${face}`);
    await writeFile(`${base}.pdf`, pdf);
    // A 600 dpi preview of the same page, to check by eye.
    await tab.screenshot({ path: `${base}.png`, scale: "device" });
    written.push(`${base}.pdf`);
  }
}

await browser.close();
console.log(written.map((f) => path.relative(ROOT, f)).join("\n"));
