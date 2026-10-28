import { describe, expect, it } from "vitest";
import type { MenuItem } from "../api/menu";
import {
  emptyItemFilters,
  filterAdminItems,
  hasItemFilters,
} from "./itemFilters";

const categories = [
  {
    id: "c1",
    nameEn: "Hot drinks",
    nameAm: null,
    sortOrder: 1,
    isVisible: true,
  },
  { id: "c2", nameEn: "Food", nameAm: null, sortOrder: 2, isVisible: false },
];

const base: MenuItem = {
  id: "",
  categoryId: "c1",
  nameEn: "",
  nameAm: null,
  descriptionEn: null,
  descriptionAm: null,
  priceEtb: 10,
  imagePath: null,
  isAvailable: true,
  isFeatured: false,
  availableFrom: null,
  availableTo: null,
  tagIds: [],
};
const items: MenuItem[] = [
  { ...base, id: "1", nameEn: "Macchiato", isFeatured: true },
  { ...base, id: "2", nameEn: "Cappuccino", isAvailable: false },
  {
    ...base,
    id: "3",
    categoryId: "c2",
    nameEn: "Ful",
    descriptionEn: "Fava beans",
  },
];
const ids = (list: MenuItem[]) => list.map((i) => i.id);
const run = (f: Partial<typeof emptyItemFilters>) =>
  ids(filterAdminItems(items, categories, { ...emptyItemFilters, ...f }));

describe("filterAdminItems", () => {
  it("returns everything with no filters", () => {
    expect(run({})).toEqual(["1", "2", "3"]);
  });

  it("searches name, description and category name", () => {
    expect(run({ query: "mac" })).toEqual(["1"]);
    expect(run({ query: "fava" })).toEqual(["3"]);
    expect(run({ query: "hot" })).toEqual(["1", "2"]);
  });

  it("filters by category", () => {
    expect(run({ categoryId: "c2" })).toEqual(["3"]);
  });

  it("filters by status", () => {
    expect(run({ status: "available" })).toEqual(["1", "3"]);
    expect(run({ status: "unavailable" })).toEqual(["2"]);
    expect(run({ status: "popular" })).toEqual(["1"]);
  });

  it("combines every filter", () => {
    expect(
      run({ query: "cap", status: "unavailable", categoryId: "c1" }),
    ).toEqual(["2"]);
    expect(run({ query: "cap", status: "available" })).toEqual([]);
  });
});

describe("hasItemFilters", () => {
  it("is false for the empty filters and for blank search", () => {
    expect(hasItemFilters(emptyItemFilters)).toBe(false);
    expect(hasItemFilters({ ...emptyItemFilters, query: "  " })).toBe(false);
  });

  it("is true when any filter is set", () => {
    expect(hasItemFilters({ ...emptyItemFilters, status: "popular" })).toBe(
      true,
    );
  });
});
