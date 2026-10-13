/**
 * Print-ready files for the physical card.
 *
 * It draws the two faces of the web card in HTML, with the same data
 * (`lib/contact.ts`), palette and logos (`lib/brand.ts`), and prints them
 * with Chromium to PDF at the European card size, 85 × 55 mm, plus 3 mm of
 * bleed on every side (91 × 61 mm, no crop marks: that is what online
 * printers ask for). The text is set a little larger than on screen: the web
 * card is viewed at twice its real size, and the smallest labels there would
 * come out under 4 pt on paper.
 *
 *   npm run print:cards            # writes print/out/*.pdf and *.png
 *
 * Both languages are produced; pick one when ordering.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "print", "out");

const { BRAND, LOGO, THEMES, WATERMARK } = await import("../lib/brand.ts");
const { contactIn } = await import("../lib/contact.ts");
const { dictionary } = await import("../lib/dictionary.ts");

const THEME = "dark";
const PALETTE = THEMES[THEME];

/** Trim size and bleed, in mm. */
const TRIM = { width: 85, height: 55 };
const BLEED = 3;
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
  const field = (y, label, value) => `
    <div class="abs muted caps" style="left:${PAD}mm; top:${y}mm; font-size:5.5pt; font-weight:600; letter-spacing:0.18em">${label}</div>
    <div class="abs" style="left:${PAD}mm; top:${y + 2.7}mm; font-size:8.5pt">${value}</div>`;
  const wmWidth = 29;
  const wmHeight = (wmWidth * WATERMARK[THEME].height) / WATERMARK[THEME].width;

  return `<div class="page">
    <!-- Brand hairline along the left edge, into the bleed. -->
    <div class="abs" style="left:0; top:0; width:${BLEED + 0.7}mm; height:${PAGE.height}mm; background:${BRAND.accent}"></div>
    <div class="trim">
      <div class="abs" style="left:${PAD}mm; top:8.5mm; font-size:15pt; font-weight:600; letter-spacing:-0.01em">${contact.name}</div>
      <div class="abs muted" style="left:${PAD}mm; top:15.3mm; font-size:7.5pt">${contact.jobTitle}</div>
      <div class="abs accent caps" style="left:${PAD}mm; top:18.9mm; font-size:6pt; font-weight:600; letter-spacing:0.28em">${contact.company}</div>
      <div class="abs muted" style="left:${PAD}mm; top:22.6mm; font-size:6.5pt">${contact.tagline}</div>
      <div class="abs" style="left:${PAD}mm; top:27mm; width:${TRIM.width - 2 * PAD}mm; height:0.15mm; background:${PALETTE.inkMuted}; opacity:0.3"></div>
      ${field(29.6, labels.email, contact.email)}
      ${field(36.4, labels.phone, contact.phone)}
      ${field(43.2, labels.website, contact.website)}
      <img src="${watermark}" style="position:absolute; right:${PAD}mm; bottom:${PAD}mm; width:${wmWidth}mm; height:${wmHeight}mm; opacity:0.1">
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
// 300 dpi previews: CSS millimetres render at 96 dpi, so scale the device.
const DPI = 300;
const context = await browser.newContext({
  deviceScaleFactor: DPI / 96,
  viewport: { width: Math.ceil((PAGE.width / 25.4) * 96), height: Math.ceil((PAGE.height / 25.4) * 96) },
});
const tab = await context.newPage();
const written = [];

for (const language of ["es", "en"]) {
  const contact = contactIn(language);
  const labels = dictionary(language).fields;
  const faces = { front: front(contact, labels, watermark), back: back(contact, logo) };

  for (const [face, html] of Object.entries(faces)) {
    await tab.setContent(page(html), { waitUntil: "load" });
    const pdf = await tab.pdf({ printBackground: true, preferCSSPageSize: true });
    const base = path.join(OUT, `card-${language}-${face}`);
    await writeFile(`${base}.pdf`, pdf);
    // A 300 dpi preview of the same page, to check by eye.
    await tab.screenshot({ path: `${base}.png`, scale: "device" });
    written.push(`${base}.pdf`);
  }
}

await browser.close();
console.log(written.map((f) => path.relative(ROOT, f)).join("\n"));
