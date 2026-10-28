import { call, type AdminCategory } from "./itemsApi";

/** What the category create and update routes accept. */
export interface CategoryPayload {
  nameEn: string;
  nameAm: string;
  isVisible: boolean;
}

export async function createCategory(
  payload: CategoryPayload,
): Promise<AdminCategory> {
  const res = await call("/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return (await res.json()) as AdminCategory;
}

export async function updateCategory(
  id: string,
  payload: CategoryPayload,
): Promise<AdminCategory> {
  const res = await call(`/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return (await res.json()) as AdminCategory;
}

/** Saves the new order and returns the full, renumbered list. */
export async function reorderCategories(
  ids: string[],
): Promise<AdminCategory[]> {
  const res = await call("/categories/order", {
    method: "PUT",
    body: JSON.stringify({ ids }),
  });
  return (await res.json()) as AdminCategory[];
}

export async function deleteCategory(id: string): Promise<void> {
  await call(`/categories/${id}`, { method: "DELETE" });
}
