# Printing the card

`npm run print:cards -- es` writes the files to `out/` (ignored by git): a PDF per
face, 89 × 59 mm (85 × 55 mm of card plus 2 mm of bleed on every side, no crop
marks), and a 600 dpi PNG preview of each. Upload the PDF: it is vector, so the
text stays sharp whatever the editor does with it.

## What to order (notes from 2026-11-02)

- **Paper:** 350 g/m² coated, nothing lighter. No textured or uncoated stock: a
  solid dark background looks blotchy on porous paper and the 5 pt labels fill in.
- **Finish:** matte or soft-touch lamination on both sides. Gloss glares on the
  dark face, and unlaminated paper shows fingerprints and scuffs within a week.
- **Colour:** the PDFs are RGB and the printer converts them to CMYK. Ask for a
  rich black for the background or it comes out dark grey. The green of the band
  and the company name will shift a little from the screen; that is normal.
- **Corners:** rounded at 3 mm if offered, as on the web card. Straight works too.
- **Run:** a short first run (100) to check the black and the green before a
  larger order. One language, Spanish.
- **In the editor:** the file already carries the bleed, so pick the option
  that says the file includes bleed (or "no extra bleed") rather than adding
  more. Keep the text inside the safe area the editor draws; the layout leaves
  6 mm from the trim line, which is more than any printer asks for.
