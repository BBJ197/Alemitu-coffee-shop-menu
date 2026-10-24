import { describe, expect, it } from "vitest";
import { formatEtb } from "./format";

describe("formatEtb", () => {
  it("formats whole amounts without decimals", () => {
    expect(formatEtb(55)).toBe("ETB 55");
  });

  it("adds thousands separators", () => {
    expect(formatEtb(1250)).toBe("ETB 1,250");
  });

  it("shows two decimals for fractional amounts", () => {
    expect(formatEtb(55.5)).toBe("ETB 55.50");
  });
});
