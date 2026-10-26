// Usage: node scripts/shrink-image.mjs <file.webp> [maxWidth] [quality]
import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const [file, width = "1600", quality = "70"] = process.argv.slice(2);
if (!file) {
  console.error(
    "Usage: node scripts/shrink-image.mjs <file.webp> [maxWidth] [quality]",
  );
  process.exit(1);
}

const input = await readFile(file);
const output = await sharp(input)
  .resize({ width: Number(width), withoutEnlargement: true })
  .webp({ quality: Number(quality) })
  .toBuffer();

const kb = (n) => (n / 1024).toFixed(1) + " kB";
if (output.length >= input.length) {
  console.log(
    `No gain (${kb(input.length)} -> ${kb(output.length)}). File left unchanged.`,
  );
} else {
  await writeFile(file, output);
  console.log(`${file}: ${kb(input.length)} -> ${kb(output.length)}`);
}
