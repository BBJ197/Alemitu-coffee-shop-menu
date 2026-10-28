import type { MenuItem } from "../api/menu";
import { filterItems } from "../lib/filterMenu";
import type { AdminCategory } from "./itemsApi";

export type StatusFilter = "all" | "available" | "unavailable" | "popular";

export interface ItemFilters {
  query: string;
  categoryId: string;
  status: StatusFilter;
}

export const emptyItemFilters: ItemFilters = {
  query: "",
  categoryId: "",
  status: "all",
};

export function hasItemFilters(filters: ItemFilters): boolean {
  return (
    filters.query.trim() !== "" ||
    filters.categoryId !== "" ||
    filters.status !== "all"
  );
}

/** Search (name, description, category) and category reuse the customer menu logic; status is added here. All combine. */
export function filterAdminItems(
  items: MenuItem[],
  categories: AdminCategory[],
  filters: ItemFilters,
): MenuItem[] {
  const matched = filterItems(
    { categories, items, tags: [] },
    {
      query: filters.query,
      categoryId: filters.categoryId || null,
      tagSlugs: [],
    },
  );
  return matched.filter((item) => {
    if (filters.status === "available") return item.isAvailable;
    if (filters.status === "unavailable") return !item.isAvailable;
    if (filters.status === "popular") return item.isFeatured;
    return true;
  });
}
