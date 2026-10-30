import { describe, expect, it } from "vitest";
import { AdminApiError } from "./api";
import {
  emptyItemForm,
  fromItem,
  serverFieldErrors,
  toPayload,
  validateItemForm,
  type ItemFormValues,
} from "./itemForm";

const valid: ItemFormValues = {
  ...emptyItemForm,
  categoryId: "c1",
  nameEn: "Macchiato",
  price: "55",
};
const errorsFor = (patch: Partial<ItemFormValues>) =>
  validateItemForm({ ...valid, ...patch });

describe("validateItemForm", () => {
  it("accepts a minimal valid form", () => {
    expect(validateItemForm(valid)).toEqual({});
  });

  it("asks for the required fields", () => {
    expect(validateItemForm(emptyItemForm)).toEqual({
      categoryId: "Choose a category",
      nameEn: "Name is required",
      price: "Price is required",
    });
  });

  it("accepts whole and 1-2 decimal prices", () => {
    for (const price of ["55", "55.5", "55.50", "0.5"])
      expect(errorsFor({ price })).toEqual({});
  });

  it("rejects bad prices", () => {
    expect(errorsFor({ price: "55.555" }).price).toMatch(/like 55/);
    expect(errorsFor({ price: "abc" }).price).toMatch(/like 55/);
    expect(errorsFor({ price: "-5" }).price).toMatch(/like 55/);
    expect(errorsFor({ price: "0" }).price).toBe(
      "Price must be greater than 0",
    );
    expect(errorsFor({ price: "100001" }).price).toBe("Price is too high");
  });

  it("limits text length", () => {
    expect(errorsFor({ nameEn: "x".repeat(121) }).nameEn).toMatch(/120/);
    expect(errorsFor({ descriptionEn: "x".repeat(501) }).descriptionEn).toMatch(
      /500/,
    );
  });
});

describe("toPayload and fromItem", () => {
  it("turns the form into the API payload", () => {
    expect(
      toPayload({ ...valid, price: "55.5", tagIds: ["t1"] }),
    ).toMatchObject({
      priceEtb: 55.5,
      imagePath: null,
      tagIds: ["t1"],
    });
  });

  it("keeps an existing photo when the form is saved again", () => {
    const form = fromItem({
      id: "i1",
      categoryId: "c1",
      nameEn: "Macchiato",
      nameAm: null,
      descriptionEn: null,
      descriptionAm: null,
      priceEtb: 55.5,
      imagePath: "photos/mac.webp",
      isAvailable: true,
      isFeatured: false,
      tagIds: ["t1"],
    });
    expect(form).toMatchObject({
      price: "55.5",
      nameAm: "",
    });
    expect(toPayload(form).imagePath).toBe("photos/mac.webp");
  });
});

describe("serverFieldErrors", () => {
  it("maps API field messages to form fields", () => {
    const error = new AdminApiError(400, "validation_failed", {
      priceEtb: ["Price must be greater than 0"],
      nameEn: ["Name is required"],
    });
    expect(serverFieldErrors(error)).toEqual({
      price: "Price must be greater than 0",
      nameEn: "Name is required",
    });
  });

  it("ignores other errors", () => {
    expect(serverFieldErrors(new AdminApiError(500, null))).toEqual({});
    expect(serverFieldErrors(new TypeError("x"))).toEqual({});
  });
});
