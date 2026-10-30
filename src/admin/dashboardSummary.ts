import type { AdminCategory, AdminItem } from "./itemsApi";

export interface DashboardSummary {
  items: number;
  available: number;
  unavailable: number;
  popular: number;
  scheduled: number;
  withoutPhoto: number;
  categories: number;
  hiddenCategories: number;
  /** Items sitting in a hidden category, so customers can't see them at all. */
  itemsInHiddenCategories: number;
  unavailableItems: AdminItem[];
}

export function summarize(
  items: AdminItem[],
  categories: AdminCategory[],
): DashboardSummary {
  const hidden = new Set(
    categories.filter((c) => !c.isVisible).map((c) => c.id),
  );
  const unavailableItems = items.filter((i) => !i.isAvailable);
  return {
    items: items.length,
    available: items.length - unavailableItems.length,
    unavailable: unavailableItems.length,
    popular: items.filter((i) => i.isFeatured).length,
    scheduled: items.filter((i) => i.availableFrom || i.availableTo).length,
    withoutPhoto: items.filter((i) => !i.imagePath).length,
    categories: categories.length,
    hiddenCategories: hidden.size,
    itemsInHiddenCategories: items.filter((i) => hidden.has(i.categoryId))
      .length,
    unavailableItems,
  };
}
