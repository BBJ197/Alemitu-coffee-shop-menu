import { describe, expect, it } from "vitest";
import { summarize } from "./dashboardSummary";
import type { AdminCategory, AdminItem } from "./itemsApi";

const category = (id: string, isVisible = true): AdminCategory => ({
  id,
  nameEn: id,
  nameAm: null,
  sortOrder: 1,
  isVisible,
});

const item = (id: string, over: Partial<AdminItem> = {}): AdminItem => ({
  id,
  categoryId: "c1",
  nameEn: id,
  nameAm: null,
  descriptionEn: null,
  descriptionAm: null,
  priceEtb: 50,
  imagePath: "/api/images/x",
  isAvailable: true,
  isFeatured: false,
  availableFrom: null,
  availableTo: null,
  tagIds: [],
  ...over,
});

describe("summarize", () => {
  it("counts an empty menu as all zeros", () => {
    expect(summarize([], [])).toEqual({
      items: 0,
      available: 0,
      unavailable: 0,
      popular: 0,
      scheduled: 0,
      withoutPhoto: 0,
      categories: 0,
      hiddenCategories: 0,
      itemsInHiddenCategories: 0,
      unavailableItems: [],
    });
  });

  it("counts availability, popular, schedules and missing photos", () => {
    const items = [
      item("a"),
      item("b", { isAvailable: false }),
      item("c", { isFeatured: true, imagePath: null }),
      item("d", { availableFrom: "06:00", availableTo: "11:00" }),
      item("e", { availableFrom: "17:00" }),
    ];
    const s = summarize(items, [category("c1")]);
    expect(s).toMatchObject({
      items: 5,
      available: 4,
      unavailable: 1,
      popular: 1,
      scheduled: 2,
      withoutPhoto: 1,
      categories: 1,
      hiddenCategories: 0,
    });
    expect(s.unavailableItems.map((i) => i.id)).toEqual(["b"]);
  });

  it("counts hidden categories and the items inside them", () => {
    const items = [
      item("a"),
      item("b", { categoryId: "c2" }),
      item("c", { categoryId: "c2" }),
    ];
    const s = summarize(items, [category("c1"), category("c2", false)]);
    expect(s.hiddenCategories).toBe(1);
    expect(s.itemsInHiddenCategories).toBe(2);
  });
});
