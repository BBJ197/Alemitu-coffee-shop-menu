import { describe, expect, it } from "vitest";
import { iconForCategory, iconForTag } from "./iconNames";

describe("iconForTag", () => {
  it("maps the base tags and ignores unknown ones", () => {
    expect(iconForTag("hot")).toBe("flame");
    expect(iconForTag("cold")).toBe("snow");
    expect(iconForTag("custom-tag")).toBeNull();
  });
});

describe("iconForCategory", () => {
  it("picks an icon from the category name", () => {
    expect(iconForCategory("Hot drinks")).toBe("flame");
    expect(iconForCategory("Cold drinks")).toBe("snow");
    expect(iconForCategory("Food")).toBe("fork");
  });

  it("falls back to a cup", () => {
    expect(iconForCategory("Desserts")).toBe("cup");
  });
});
