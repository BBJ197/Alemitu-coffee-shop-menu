import { describe, expect, it } from "vitest";
import { pickPhoto } from "./photos";

const photos = ["a.webp", "b.webp", "c.webp"];

describe("pickPhoto", () => {
  it("gives the same photo for the same category index", () => {
    expect(pickPhoto(1, photos)).toBe("b.webp");
    expect(pickPhoto(1, photos)).toBe(pickPhoto(1, photos));
  });

  it("wraps around when there are more categories than photos", () => {
    expect(pickPhoto(3, photos)).toBe("a.webp");
  });

  it("returns undefined when there are no photos or the index is unknown", () => {
    expect(pickPhoto(0, [])).toBeUndefined();
    expect(pickPhoto(-1, photos)).toBeUndefined();
  });
});
