import { API_BASE } from "../api/base";

/**
 * Turns the path stored on an item ("/api/images/<id>") into a full URL.
 * Anything else (no photo, or an old placeholder value) gives undefined,
 * so the caller can fall back to the bundled test photo.
 */
export function photoUrl(
  imagePath: string | null | undefined,
): string | undefined {
  return imagePath?.startsWith("/api/images/")
    ? `${API_BASE}${imagePath}`
    : undefined;
}
