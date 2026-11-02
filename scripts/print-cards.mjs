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
import { crc32 } from "node:zlib";
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
/**
 * The PDF page in whole points: Chromium rounds the page to them, and a body
 * laid out at the exact millimetres (89 mm = 252.28 pt) overflows the rounded
 * page by a fraction and spills a blank second sheet. Declaring the page and
 * the body in the same whole points keeps it to one sheet; the face itself is
 * drawn at the true millimetres and overflows the page by less than 0.1 mm.
 */
const PAGE_PT = {
  width: Math.round((PAGE.width / 25.4) * 72),
  height: Math.round((PAGE.height / 25.4) * 72),
};
/** Inner margin of the web card (150 of 2048 px), on paper. */
const PAD = 6.2;

/**
 * The landing's type (https://1to1digital.solutions): Inter for the text and
 * Outfit for the headings. The files are the latin subsets next/font builds
 * for the landing, copied into `print/fonts/` (both under the SIL Open Font
 * License). They are embedded in the page so Chromium prints them without
 * depending on what the system has installed. The landing loads no italic
 * face of Inter, so the tagline's italic is the synthesised slant, as on the
 * landing itself.
 */
const FONT_STACK = 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const HEADING_STACK = `Outfit, ${FONT_STACK}`;

async function svgDataUri(file) {
  const svg = await readFile(path.join(ROOT, "public", file), "utf8");
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

async function fontFace(family, file) {
  const woff2 = await readFile(path.join(ROOT, "print", "fonts", file));
  return `@font-face { font-family: ${family}; font-style: normal; font-weight: 100 900; src: url(data:font/woff2;base64,${woff2.toString("base64")}) format("woff2"); }`;
}

/**
 * Writes the pixel density into a PNG (a `pHYs` chunk). Playwright leaves it
 * out, and without it the printers' editors guess one and place the image at
 * the wrong size; with it, the preview opens at 89 × 59 mm like the PDF.
 */
function withDpi(png, dpi) {
  const perMetre = Math.round(dpi / 0.0254);
  const data = Buffer.alloc(9);
  data.writeUInt32BE(perMetre, 0);
  data.writeUInt32BE(perMetre, 4);
  data[8] = 1; // unit: metre
  const typeAndData = Buffer.concat([Buffer.from("pHYs", "ascii"), data]);
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  typeAndData.copy(chunk, 4);
  chunk.writeUInt32BE(crc32(typeAndData) >>> 0, 8 + data.length);
  // Right after IHDR: signature (8) + IHDR chunk (4 + 4 + 13 + 4).
  const afterIhdr = 8 + 25;
  return Buffer.concat([png.subarray(0, afterIhdr), chunk, png.subarray(afterIhdr)]);
}

/**
 * Scales the font of every `[data-fit-width]` element so its one line of
 * text spans exactly that many millimetres: the text is measured as drawn,
 * so the fit holds whatever font the system resolves the stack to.
 */
async function fitToWidth(tab) {
  await tab.evaluate(async () => {
    await document.fonts.ready;
    const MM = 96 / 25.4;
    for (const el of document.querySelectorAll("[data-fit-width]")) {
      const target = Number(el.dataset.fitWidth) * MM;
      const size = parseFloat(getComputedStyle(el).fontSize);
      el.style.fontSize = `${(size * target) / el.getBoundingClientRect().width}px`;
    }
  });
}

function page(body, fonts) {
  return `<!doctype html>
<html><head><meta charset="utf-8">
<style>
  ${fonts}
  @page { size: ${PAGE_PT.width}pt ${PAGE_PT.height}pt; margin: 0; }
  /* The PDF page is rounded to whole points (89 mm → 252 pt = 88.9 mm), so a
     face cut exactly to size leaves a hairline of the body showing on one
     edge. The body is painted like the card and the face is a touch larger
     than the page: whatever the rounding does, the edge stays dark. */
  html, body { margin: 0; padding: 0; background: ${PALETTE.card}; }
  /* Clipped to the page: the larger face must not spill onto a second sheet. */
  body { width: ${PAGE_PT.width}pt; height: ${PAGE_PT.height}pt; overflow: hidden; font-family: ${FONT_STACK}; -webkit-font-smoothing: antialiased; }
  .page {
    position: relative; overflow: hidden;
    width: ${PAGE.width + 0.5}mm; height: ${PAGE.height + 0.5}mm;
    background: ${PALETTE.card}; color: ${PALETTE.ink};
  }
  /* Everything is placed from the trim box, not from the bleed edge. */
  .trim { position: absolute; left: ${BLEED}mm; top: ${BLEED}mm; width: ${TRIM.width}mm; height: ${TRIM.height}mm; }
  .abs { position: absolute; white-space: nowrap; line-height: 1; }
  .muted { color: ${PALETTE.inkMuted}; }
  .accent { color: ${PALETTE.accentInk}; }
  /* A class and not an inline style: the stack carries double quotes, which
     would end a style attribute halfway. */
  .heading { font-family: ${HEADING_STACK}; }
  .caps { text-transform: uppercase; }
</style></head><body>${body}</body></html>`;
}

function front(contact, labels, watermark) {
  // Each field is a label and its value, close together so they read as one
  // thing, with clear air before the next field: the gap inside a field is
  // smaller than the gap between fields.
  // The label is clearly smaller than the value: in small caps with tracking
  // it reads larger than its size, so 4.6 pt against 8 pt keeps the value
  // as the thing that is read.
  const LABEL_TO_VALUE = 2.2;
  const field = (y, label, value) => `
    <div class="abs muted caps" style="left:${PAD}mm; top:${y}mm; font-size:4.6pt; font-weight:600; letter-spacing:0.18em">${label}</div>
    <div class="abs" style="left:${PAD}mm; top:${y + LABEL_TO_VALUE}mm; font-size:8pt">${value}</div>`;
  // Four fields anchored to the bottom, like the web face, with the room the
  // one-line tagline leaves spread between them. The block ends 5 mm from
  // the cut, closer than the side margin: the safe area printers ask for is
  // 3 mm, and the extra millimetre of air goes between the fields.
  const STEP = 6.9;
  const PAD_BOTTOM = 5;
  const VALUE_HEIGHT = 2.85; // 8 pt line box
  const FIRST = TRIM.height - PAD_BOTTOM - VALUE_HEIGHT - LABEL_TO_VALUE - 3 * STEP;
  const [linkedIn] = PROFILES;
  const wmWidth = 20;
  const wmHeight = (wmWidth * WATERMARK[THEME].height) / WATERMARK[THEME].width;

  // The band on the left edge, into the bleed: 1.6 mm visible once trimmed.
  // Thicker than the hairline on screen on purpose: the cut can land up to
  // a millimetre inside the trim line and the band has to survive it.
  const BAND = 1.6;
  // A soft turquoise glow in the top-right corner, like the one behind the
  // landing's hero: a radial gradient (vector in the PDF, no raster blur) in
  // the brand green at low opacity. Top right because that corner is empty
  // (the bottom one holds the watermark) and it balances the band on the left.
  const GLOW = 52;

  return `<div class="page">
    <div class="abs" style="right:${-GLOW * 0.4}mm; top:${-GLOW * 0.4}mm; width:${GLOW}mm; height:${GLOW}mm; border-radius:50%; background:radial-gradient(circle, rgba(31,149,122,0.22) 0%, rgba(31,149,122,0.09) 40%, rgba(31,149,122,0) 70%)"></div>
    <div class="abs" style="left:0; top:0; width:${BLEED + BAND}mm; height:${PAGE.height}mm; background:${BRAND.accent}"></div>
    <div class="trim">
      <div class="abs heading" style="left:${PAD}mm; top:6.2mm; font-size:13pt; font-weight:700; letter-spacing:-0.01em">${contact.name}</div>
      <div class="abs muted" style="left:${PAD}mm; top:11.5mm; font-size:7.5pt">${contact.jobTitle}</div>
      <!-- The tagline is what the card says: semibold italic in the brand
           green, on ONE line that runs edge to edge of the text area (the
           size is fitted to the width before printing, see fitToWidth). It
           takes over the green from the company name, which is not written
           out here: the logo on the back and the watermark say it. -->
      <div class="abs accent" data-fit-width="${TRIM.width - 2 * PAD}" style="left:${PAD}mm; top:15.8mm; font-size:8pt; font-weight:600; font-style:italic">${contact.tagline}</div>
      <!-- The divider sits halfway between the tagline and the first field:
           3 mm of air above it and 3 mm below (see FIRST). -->
      <div class="abs" style="left:${PAD}mm; top:21.3mm; width:${TRIM.width - 2 * PAD}mm; height:0.15mm; background:${PALETTE.inkMuted}; opacity:0.3"></div>
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
const [watermark, logo, interFace, outfitFace] = await Promise.all([
  svgDataUri(path.basename(WATERMARK[THEME].src)),
  svgDataUri(path.basename(LOGO.brand.src)),
  fontFace("Inter", "inter-latin.woff2"),
  fontFace("Outfit", "outfit-latin.woff2"),
]);
const fonts = `${interFace}\n${outfitFace}`;

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
    await tab.setContent(page(html, fonts), { waitUntil: "load" });
    await fitToWidth(tab);
    const pdf = await tab.pdf({ printBackground: true, preferCSSPageSize: true });
    const base = path.join(OUT, `card-${language}-${face}`);
    await writeFile(`${base}.pdf`, pdf);
    // A 600 dpi preview of the same page, to check by eye.
    const png = await tab.screenshot({ scale: "device" });
    await writeFile(`${base}.png`, withDpi(png, DPI));
    written.push(`${base}.pdf`);
  }
}

await browser.close();
console.log(written.map((f) => path.relative(ROOT, f)).join("\n"));
