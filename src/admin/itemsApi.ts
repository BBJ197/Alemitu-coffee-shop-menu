import { API_BASE } from "../api/base";
import type { MenuItem } from "../api/menu";
import { errorFrom } from "./api";

/** The admin API returns the same shape as the public menu items. */
export type AdminItem = MenuItem;

export interface AdminCategory {
  id: string;
  nameEn: string;
  nameAm: string | null;
  sortOrder: number;
  isVisible: boolean;
  /** How many items use this category. Sent by the API; used for delete warnings. */
  itemCount?: number;
}

/** What the create and update routes accept. */
export interface ItemPayload {
  categoryId: string;
  nameEn: string;
  nameAm: string;
  descriptionEn: string;
  descriptionAm: string;
  priceEtb: number;
  imagePath: string | null;
  isAvailable: boolean;
  isFeatured: boolean;
  tagIds: string[];
}

export async function call(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const res = await fetch(`${API_BASE}/api/admin${path}`, {
    credentials: "include",
    ...init,
    headers: init.body ? { "Content-Type": "application/json" } : undefined,
  });
  if (!res.ok) throw await errorFrom(res);
  return res;
}

export async function fetchAdminItems(
  signal?: AbortSignal,
): Promise<AdminItem[]> {
  return (await (await call("/items", { signal })).json()) as AdminItem[];
}

export async function fetchAdminCategories(
  signal?: AbortSignal,
): Promise<AdminCategory[]> {
  return (await (
    await call("/categories", { signal })
  ).json()) as AdminCategory[];
}

export async function createItem(payload: ItemPayload): Promise<AdminItem> {
  const res = await call("/items", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return (await res.json()) as AdminItem;
}

export async function updateItem(
  id: string,
  payload: ItemPayload,
): Promise<AdminItem> {
  const res = await call(`/items/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return (await res.json()) as AdminItem;
}

export async function setItemAvailability(
  id: string,
  isAvailable: boolean,
): Promise<AdminItem> {
  const res = await call(`/items/${id}/availability`, {
    method: "PATCH",
    body: JSON.stringify({ isAvailable }),
  });
  return (await res.json()) as AdminItem;
}

export async function deleteItem(id: string): Promise<void> {
  await call(`/items/${id}`, { method: "DELETE" });
}
