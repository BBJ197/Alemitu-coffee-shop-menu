export type IconName =
  | "search"
  | "grid"
  | "leaf"
  | "fork"
  | "bowl"
  | "flame"
  | "snow"
  | "star"
  | "cup";

export function iconForTag(slug: string): IconName | null {
  const map: Record<string, IconName> = {
    vegetarian: "leaf",
    fasting: "fork",
    "non-fasting": "bowl",
    hot: "flame",
    cold: "snow",
  };
  return map[slug] ?? null;
}

export function iconForCategory(nameEn: string): IconName {
  const n = nameEn.toLowerCase();
  if (/cold|juice|iced|smoothie/.test(n)) return "snow";
  if (/hot|tea|coffee/.test(n)) return "flame";
  if (/food|breakfast|meal|lunch|dinner|fasting/.test(n)) return "fork";
  return "cup";
}
