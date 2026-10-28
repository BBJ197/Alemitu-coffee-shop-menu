import { z } from "zod";
import { AdminApiError } from "./api";
import type { AdminItem, ItemPayload } from "./itemsApi";

/** Form state: everything the inputs hold is text or a checkbox. */
export interface ItemFormValues {
  categoryId: string;
  nameEn: string;
  nameAm: string;
  descriptionEn: string;
  descriptionAm: string;
  price: string;
  isAvailable: boolean;
  isFeatured: boolean;
  availableFrom: string;
  availableTo: string;
  tagIds: string[];
  /** Not editable yet: carried through so saving never removes a photo. */
  imagePath: string | null;
}

export const emptyItemForm: ItemFormValues = {
  categoryId: "",
  nameEn: "",
  nameAm: "",
  descriptionEn: "",
  descriptionAm: "",
  price: "",
  isAvailable: true,
  isFeatured: false,
  availableFrom: "",
  availableTo: "",
  tagIds: [],
  imagePath: null,
};

const text = (max: number) =>
  z.string().trim().max(max, `Use ${max} characters or fewer`);

export const itemFormSchema = z
  .object({
    categoryId: z.string().min(1, "Choose a category"),
    nameEn: z
      .string()
      .trim()
      .min(1, "Name is required")
      .max(120, "Use 120 characters or fewer"),
    nameAm: text(120),
    descriptionEn: text(500),
    descriptionAm: text(500),
    price: z
      .string()
      .trim()
      .min(1, "Price is required")
      .refine(
        (v) => /^\d+(\.\d{1,2})?$/.test(v),
        "Enter a price like 55 or 55.50",
      )
      .refine((v) => Number(v) > 0, "Price must be greater than 0")
      .refine((v) => Number(v) <= 100000, "Price is too high"),
    availableFrom: z.string(),
    availableTo: z.string(),
  })
  .refine((v) => (v.availableFrom === "") === (v.availableTo === ""), {
    message: "Set both times or neither",
    path: ["availableTo"],
  });

/** Returns the first message per field. An empty object means the form is valid. */
export function validateItemForm(
  values: ItemFormValues,
): Record<string, string> {
  const parsed = itemFormSchema.safeParse(values);
  if (parsed.success) return {};
  const fields = z.flattenError(parsed.error).fieldErrors as Record<
    string,
    string[] | undefined
  >;
  const errors: Record<string, string> = {};
  for (const [field, messages] of Object.entries(fields)) {
    if (messages?.[0]) errors[field] = messages[0];
  }
  return errors;
}

export function toPayload(values: ItemFormValues): ItemPayload {
  return {
    categoryId: values.categoryId,
    nameEn: values.nameEn,
    nameAm: values.nameAm,
    descriptionEn: values.descriptionEn,
    descriptionAm: values.descriptionAm,
    priceEtb: Number(values.price),
    imagePath: values.imagePath,
    isAvailable: values.isAvailable,
    isFeatured: values.isFeatured,
    availableFrom: values.availableFrom || null,
    availableTo: values.availableTo || null,
    tagIds: values.tagIds,
  };
}

export function fromItem(item: AdminItem): ItemFormValues {
  return {
    categoryId: item.categoryId,
    nameEn: item.nameEn,
    nameAm: item.nameAm ?? "",
    descriptionEn: item.descriptionEn ?? "",
    descriptionAm: item.descriptionAm ?? "",
    price: String(item.priceEtb),
    isAvailable: item.isAvailable,
    isFeatured: item.isFeatured,
    availableFrom: item.availableFrom?.slice(0, 5) ?? "",
    availableTo: item.availableTo?.slice(0, 5) ?? "",
    tagIds: item.tagIds,
    imagePath: item.imagePath,
  };
}

/** Maps the API's "validation_failed" field messages onto form field names. */
export function serverFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof AdminApiError) || error.code !== "validation_failed")
    return {};
  const errors: Record<string, string> = {};
  for (const [field, messages] of Object.entries(error.fields)) {
    const first = messages[0];
    if (first) errors[field === "priceEtb" ? "price" : field] = first;
  }
  return errors;
}
