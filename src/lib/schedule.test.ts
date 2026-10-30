import { describe, expect, it } from "vitest";
import {
  formatHours,
  isServedNow,
  minutesInShopTime,
  toMinutes,
} from "./schedule";

describe("toMinutes", () => {
  it("reads database and form times", () => {
    expect(toMinutes("06:00:00")).toBe(360);
    expect(toMinutes("11:30")).toBe(690);
    expect(toMinutes("00:00")).toBe(0);
  });

  it("gives null for missing or invalid times", () => {
    for (const bad of [null, undefined, "", "noon", "24:00", "10:75"])
      expect(toMinutes(bad)).toBeNull();
  });
});

describe("minutesInShopTime", () => {
  it("uses Addis Ababa time (UTC+3) whatever the device's zone", () => {
    expect(minutesInShopTime(new Date("2026-10-30T03:00:00Z"))).toBe(360);
    expect(minutesInShopTime(new Date("2026-10-30T20:59:00Z"))).toBe(
      23 * 60 + 59,
    );
  });

  it("reads midnight as 0, not 24", () => {
    expect(minutesInShopTime(new Date("2026-10-30T21:00:00Z"))).toBe(0);
  });
});

describe("isServedNow", () => {
  const breakfast = { availableFrom: "06:00:00", availableTo: "11:00:00" };

  it("serves all day when there is no schedule", () => {
    expect(isServedNow({ availableFrom: null, availableTo: null }, 300)).toBe(
      true,
    );
    expect(isServedNow({}, 300)).toBe(true);
  });

  it("includes the start and excludes the end", () => {
    expect(isServedNow(breakfast, 359)).toBe(false);
    expect(isServedNow(breakfast, 360)).toBe(true);
    expect(isServedNow(breakfast, 659)).toBe(true);
    expect(isServedNow(breakfast, 660)).toBe(false);
  });

  it("handles a window that runs past midnight", () => {
    const late = { availableFrom: "18:00", availableTo: "02:00" };
    expect(isServedNow(late, 17 * 60 + 59)).toBe(false);
    expect(isServedNow(late, 18 * 60)).toBe(true);
    expect(isServedNow(late, 0)).toBe(true);
    expect(isServedNow(late, 119)).toBe(true);
    expect(isServedNow(late, 120)).toBe(false);
  });

  it("treats identical start and end as all day", () => {
    expect(
      isServedNow({ availableFrom: "08:00", availableTo: "08:00" }, 900),
    ).toBe(true);
  });
});

describe("formatHours", () => {
  it("shows hours and minutes only", () => {
    expect(formatHours("06:00:00", "11:00:00")).toBe("06:00–11:00");
  });
});
