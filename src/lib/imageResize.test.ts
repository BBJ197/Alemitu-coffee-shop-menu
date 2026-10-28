import { describe, expect, it } from "vitest";
import { MAX_SOURCE_BYTES, fitWithin, validateImageFile } from "./imageResize";

describe("validateImageFile", () => {
  it("accepts JPEG, PNG and WebP", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp"])
      expect(validateImageFile({ type, size: 1000 })).toBeNull();
  });

  it("rejects other file types", () => {
    expect(validateImageFile({ type: "image/gif", size: 1000 })).toMatch(
      /JPEG, PNG or WebP/,
    );
    expect(validateImageFile({ type: "application/pdf", size: 1000 })).not.toBe(
      null,
    );
    expect(validateImageFile({ type: "", size: 1000 })).not.toBe(null);
  });

  it("rejects photos over 10 MB but accepts exactly 10 MB", () => {
    expect(
      validateImageFile({ type: "image/jpeg", size: MAX_SOURCE_BYTES }),
    ).toBeNull();
    expect(
      validateImageFile({ type: "image/jpeg", size: MAX_SOURCE_BYTES + 1 }),
    ).toMatch(/10 MB/);
  });
});

describe("fitWithin", () => {
  it("scales the longest side down to the maximum", () => {
    expect(fitWithin(4000, 3000, 1200)).toEqual({ width: 1200, height: 900 });
    expect(fitWithin(3000, 4000, 1200)).toEqual({ width: 900, height: 1200 });
  });

  it("never scales a small photo up", () => {
    expect(fitWithin(800, 600, 1200)).toEqual({ width: 800, height: 600 });
  });

  it("keeps at least one pixel on each side", () => {
    expect(fitWithin(10000, 1, 100)).toEqual({ width: 100, height: 1 });
  });
});
