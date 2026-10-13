import QRCode from "qrcode";

/**
 * A QR code ready to draw: the number of modules per side and one SVG path
 * covering every dark module, in module units (one unit = one module).
 *
 * The path is built here, at render time on the server, and not in the
 * browser: the address of the card is fixed at build, so the visitor
 * downloads a few hundred bytes of path and no encoder. Being a path and not
 * markup, it is drawn as a JSX `<path d>`: nothing goes through
 * `dangerouslySetInnerHTML`.
 */
export type QrCode = {
  size: number;
  path: string;
};

export function qrCode(text: string): QrCode {
  // Medium error correction: the code is shown on a bright screen and read
  // from close by, so the extra redundancy of a higher level would only make
  // it denser and harder to lock on to.
  const { modules } = QRCode.create(text, { errorCorrectionLevel: "M" });
  const size = modules.size;
  const path: string[] = [];

  // Each row is covered with as few rectangles as possible: a run of dark
  // modules becomes one `h` stroke. Fewer segments draw faster and keep the
  // HTML smaller, with the same result.
  for (let y = 0; y < size; y++) {
    let x = 0;
    while (x < size) {
      if (!modules.get(y, x)) {
        x++;
        continue;
      }
      let run = 1;
      while (x + run < size && modules.get(y, x + run)) run++;
      path.push(`M${x} ${y}h${run}v1h-${run}z`);
      x += run;
    }
  }

  return { size, path: path.join("") };
}
