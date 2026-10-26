// TEST PHOTOS ONLY: the same bundled photo is used for every item in a category.
// Real item photos arrive with the admin upload (M5).
const modules = import.meta.glob("/src/**/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const ORDER = [
  "hot-beveragrs",
  "cold-beveragrs",
  "refreshment",
  "dessert",
  "fasting-foods",
  "non-fasting-foods",
];

const PHOTOS = ORDER.map(
  (name) =>
    Object.entries(modules).find(([path]) =>
      path.endsWith(`/${name}.webp`),
    )?.[1],
).filter((url): url is string => Boolean(url));

export function pickPhoto(
  index: number,
  photos: readonly string[] = PHOTOS,
): string | undefined {
  if (photos.length === 0 || index < 0) return undefined;
  return photos[index % photos.length];
}
