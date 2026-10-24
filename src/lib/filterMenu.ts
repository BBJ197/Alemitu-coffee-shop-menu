import type { Menu, MenuItem } from "../api/menu";

export interface MenuFilters {
  query: string;
  categoryId: string | null;
  tagSlugs: string[];
}

export const emptyFilters: MenuFilters = {
  query: "",
  categoryId: null,
  tagSlugs: [],
};

export function hasActiveFilters(filters: MenuFilters): boolean {
  return (
    filters.query.trim() !== "" ||
    filters.categoryId !== null ||
    filters.tagSlugs.length > 0
  );
}

/**
 * Search, category and tag filters combine with AND.
 * Selected tags in the same group combine with OR; different groups combine with AND.
 */
export function filterItems(menu: Menu, filters: MenuFilters): MenuItem[] {
  const words = filters.query.toLowerCase().split(/\s+/).filter(Boolean);
  const categoryById = new Map(menu.categories.map((c) => [c.id, c] as const));
  const tagBySlug = new Map(menu.tags.map((t) => [t.slug, t] as const));

  const selectedByGroup = new Map<string, Set<string>>();
  for (const slug of filters.tagSlugs) {
    const tag = tagBySlug.get(slug);
    if (!tag) continue;
    const ids = selectedByGroup.get(tag.group) ?? new Set<string>();
    ids.add(tag.id);
    selectedByGroup.set(tag.group, ids);
  }

  return menu.items.filter((item) => {
    if (filters.categoryId && item.categoryId !== filters.categoryId)
      return false;

    for (const ids of selectedByGroup.values()) {
      if (!item.tagIds.some((id) => ids.has(id))) return false;
    }

    if (words.length === 0) return true;
    const category = categoryById.get(item.categoryId);
    const haystack = [
      item.nameEn,
      item.nameAm,
      item.descriptionEn,
      item.descriptionAm,
      category?.nameEn,
      category?.nameAm,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return words.every((word) => haystack.includes(word));
  });
}
