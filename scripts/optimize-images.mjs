import sharp from "sharp";
import { statSync } from "node:fs";

const dir = "src/assets/images";
const jobs = [
  ["hero.png", 1200],
  ["About-us.png", 900],
  ["hot-beveragrs.png", 640],
  ["cold-beveragrs.png", 640],
  ["refreshment.png", 640],
  ["fasting-foods.png", 640],
  ["non-fasting-foods.png", 640],
  ["dessert.png", 640],
  ["user-5.png", 200],
];

for (const [file, width] of jobs) {
  const src = `${dir}/${file}`;
  const out = src.replace(/\.png$/, ".webp");
  await sharp(src)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(out);
  console.log(
    `${file}: ${Math.round(statSync(src).size / 1024)} KB -> ${Math.round(statSync(out).size / 1024)} KB`,
  );
}
