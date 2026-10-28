/** Photos the admin may pick. The browser converts them all to WebP before upload. */
export const SOURCE_TYPES: readonly string[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
];
export const MAX_SOURCE_BYTES = 10 * 1024 * 1024;
/** Below the API's hard limit of 400 kB. */
export const TARGET_BYTES = 350_000;

export type ImageErrorCode = "unreadable" | "unsupported" | "too_large";

export class ImageError extends Error {
  readonly code: ImageErrorCode;
  constructor(code: ImageErrorCode) {
    super(`Photo could not be prepared: ${code}`);
    this.name = "ImageError";
    this.code = code;
  }
}

/** Returns a message for the admin, or null when the file is acceptable. */
export function validateImageFile(file: {
  type: string;
  size: number;
}): string | null {
  if (!SOURCE_TYPES.includes(file.type))
    return "Choose a JPEG, PNG or WebP photo.";
  if (file.size > MAX_SOURCE_BYTES)
    return "That photo is larger than 10 MB. Choose a smaller one.";
  return null;
}

/** Scales down to fit inside max x max, keeping the shape. Never scales up. */
export function fitWithin(width: number, height: number, max: number) {
  const scale = Math.min(1, max / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/** Tries smaller sizes and lower quality until the WebP is small enough. */
export async function prepareImage(file: File): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new ImageError("unreadable");
  }
  try {
    for (const max of [1200, 900, 700]) {
      const { width, height } = fitWithin(bitmap.width, bitmap.height, max);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) throw new ImageError("unsupported");
      context.drawImage(bitmap, 0, 0, width, height);
      for (const quality of [0.82, 0.7, 0.55]) {
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/webp", quality),
        );
        // Browsers that can't encode WebP quietly hand back a PNG instead.
        if (!blob || blob.type !== "image/webp")
          throw new ImageError("unsupported");
        if (blob.size <= TARGET_BYTES) return blob;
      }
    }
    throw new ImageError("too_large");
  } finally {
    bitmap.close();
  }
}
