import { call } from "./itemsApi";

export type TagGroup = "fasting" | "diet" | "temperature";

export interface AdminTag {
  id: string;
  slug: string;
  group: TagGroup;
  nameEn: string;
  nameAm: string | null;
  sortOrder: number;
  /** How many items carry this tag. */
  itemCount: number;
}

export interface NewTagPayload {
  group: TagGroup;
  nameEn: string;
  nameAm: string;
}

export interface RenameTagPayload {
  nameEn: string;
  nameAm: string;
}

export async function fetchAdminTags(
  signal?: AbortSignal,
): Promise<AdminTag[]> {
  return (await (await call("/tags", { signal })).json()) as AdminTag[];
}

export async function createTag(payload: NewTagPayload): Promise<AdminTag> {
  const res = await call("/tags", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return (await res.json()) as AdminTag;
}

export async function updateTag(
  id: string,
  payload: RenameTagPayload,
): Promise<AdminTag> {
  const res = await call(`/tags/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return (await res.json()) as AdminTag;
}

/** Saves the new order and returns the full, renumbered list. */
export async function reorderTags(ids: string[]): Promise<AdminTag[]> {
  const res = await call("/tags/order", {
    method: "PUT",
    body: JSON.stringify({ ids }),
  });
  return (await res.json()) as AdminTag[];
}

export async function deleteTag(id: string): Promise<void> {
  await call(`/tags/${id}`, { method: "DELETE" });
}
