import { API_BASE } from "../api/base";
import { errorFrom } from "./api";

/** Uploads one WebP photo and returns the path to store on the item. */
export async function uploadImage(blob: Blob): Promise<string> {
  const res = await fetch(`${API_BASE}/api/admin/images`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "image/webp" },
    body: blob,
  });
  if (!res.ok) throw await errorFrom(res);
  return ((await res.json()) as { path: string }).path;
}
