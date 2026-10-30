import { describe, expect, it } from "vitest";
import type { Menu, MenuItem } from "../api/menu";
import {
  emptyFilters,
  filterItems,
  hasActiveFilters,
  type MenuFilters,
} from "./filterMenu";

const item = (
  id: string,
  nameEn: string,
  categoryId: string,
  descriptionEn: string,
  tagIds: string[],
): MenuItem => ({
  id,
  categoryId,
  nameEn,
  nameAm: null,
  descriptionEn,
  descriptionAm: null,
  priceEtb: 50,
  imagePath: null,
  isAvailable: true,
  isFeatured: false,
  tagIds,
});

const menu: Menu = {
  categories: [
    { id: "c-hot", nameEn: "Hot drinks", nameAm: null, sortOrder: 1 },
    { id: "c-cold", nameEn: "Cold drinks", nameAm: null, sortOrder: 2 },
    { id: "c-food", nameEn: "Food", nameAm: null, sortOrder: 3 },
  ],
  tags: [
    {
      id: "t-fasting",
      slug: "fasting",
      group: "fasting",
      nameEn: "Fasting",
      nameAm: null,
    },
    {
      id: "t-non-fasting",
      slug: "non-fasting",
      group: "fasting",
      nameEn: "Non-fasting",
      nameAm: null,
    },
    {
      id: "t-vegetarian",
      slug: "vegetarian",
      group: "diet",
      nameEn: "Vegetarian",
      nameAm: null,
    },
    {
      id: "t-hot",
      slug: "hot",
      group: "temperature",
      nameEn: "Hot",
      nameAm: null,
    },
    {
      id: "t-cold",
      slug: "cold",
      group: "temperature",
      nameEn: "Cold",
      nameAm: null,
    },
  ],
  items: [
    item("i1", "Macchiato", "c-hot", "Espresso with milk foam", ["t-hot"]),
    item("i2", "Spris tea", "c-hot", "Tea layered with coffee", [
      "t-hot",
      "t-fasting",
    ]),
    item("i3", "Avocado juice", "c-cold", "Fresh layered juice", [
      "t-cold",
      "t-fasting",
      "t-vegetarian",
    ]),
    item("i4", "Ful", "c-food", "Fava beans with bread", [
      "t-fasting",
      "t-vegetarian",
    ]),
    item("i5", "Chechebsa", "c-food", "Fried bread with butter", [
      "t-non-fasting",
    ]),
  ],
};

const run = (changes: Partial<MenuFilters>) =>
  filterItems(menu, { ...emptyFilters, ...changes }).map((i) => i.nameEn);

describe("filterItems", () => {
  it("returns every item when no filter is set", () => {
    expect(run({})).toHaveLength(5);
  });

  it("searches names without regard to case", () => {
    expect(run({ query: "MACCHIATO" })).toEqual(["Macchiato"]);
  });

  it("searches descriptions", () => {
    expect(run({ query: "layered" })).toEqual(["Spris tea", "Avocado juice"]);
  });

  it("searches category names", () => {
    expect(run({ query: "food" })).toEqual(["Ful", "Chechebsa"]);
  });

  it("requires every typed word to match", () => {
    expect(run({ query: "tea layered" })).toEqual(["Spris tea"]);
  });

  it("filters by category", () => {
    expect(run({ categoryId: "c-cold" })).toEqual(["Avocado juice"]);
  });

  it("combines tags in the same group with OR", () => {
    expect(run({ tagSlugs: ["fasting", "non-fasting"] })).toEqual([
      "Spris tea",
      "Avocado juice",
      "Ful",
      "Chechebsa",
    ]);
  });

  it("combines tags from different groups with AND", () => {
    expect(run({ tagSlugs: ["fasting", "hot"] })).toEqual(["Spris tea"]);
  });

  it("combines search, category and tags", () => {
    expect(run({ query: "bread", tagSlugs: ["fasting"] })).toEqual(["Ful"]);
    expect(
      run({ categoryId: "c-hot", tagSlugs: ["fasting", "vegetarian"] }),
    ).toEqual([]);
  });

  it("ignores unknown tag slugs", () => {
    expect(run({ tagSlugs: ["does-not-exist"] })).toHaveLength(5);
  });
});

describe("hasActiveFilters", () => {
  it("is false for the empty filters and for whitespace only", () => {
    expect(hasActiveFilters(emptyFilters)).toBe(false);
    expect(hasActiveFilters({ ...emptyFilters, query: "   " })).toBe(false);
  });

  it("is true when any filter is set", () => {
    expect(hasActiveFilters({ ...emptyFilters, query: "tea" })).toBe(true);
    expect(hasActiveFilters({ ...emptyFilters, categoryId: "c-hot" })).toBe(
      true,
    );
    expect(hasActiveFilters({ ...emptyFilters, tagSlugs: ["hot"] })).toBe(true);
  });
});
