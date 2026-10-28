import { describe, expect, it } from "vitest";
import { API_BASE } from "../api/base";
import { photoUrl } from "./photoUrl";

describe("photoUrl", () => {
  it("builds a full URL for an uploaded photo", () => {
    expect(photoUrl("/api/images/abc")).toBe(`${API_BASE}/api/images/abc`);
  });

  it("gives undefined when there is no uploaded photo", () => {
    expect(photoUrl(null)).toBeUndefined();
    expect(photoUrl(undefined)).toBeUndefined();
    expect(photoUrl("")).toBeUndefined();
    expect(photoUrl("photos/mac.webp")).toBeUndefined();
  });
});
