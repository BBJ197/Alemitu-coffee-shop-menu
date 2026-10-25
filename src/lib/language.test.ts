import { beforeEach, describe, expect, it } from "vitest";
import { loadLang, pickOptional, pickText, saveLang } from "./language";

const AM = "\u12A0\u121B\u122D\u129B";

beforeEach(() => localStorage.clear());

describe("pickText", () => {
  it("returns English in English mode", () => {
    expect(pickText("Tea", AM, "en")).toBe("Tea");
  });

  it("returns Amharic in Amharic mode when it exists", () => {
    expect(pickText("Tea", AM, "am")).toBe(AM);
  });

  it("falls back to English when the Amharic text is missing or blank", () => {
    expect(pickText("Tea", null, "am")).toBe("Tea");
    expect(pickText("Tea", "   ", "am")).toBe("Tea");
  });
});

describe("pickOptional", () => {
  it("keeps null when there is no text in either language", () => {
    expect(pickOptional(null, null, "am")).toBeNull();
    expect(pickOptional("Hot", null, "am")).toBe("Hot");
  });
});

describe("language storage", () => {
  it("defaults to English and ignores unknown stored values", () => {
    expect(loadLang()).toBe("en");
    localStorage.setItem("alemitu-lang", "xx");
    expect(loadLang()).toBe("en");
  });

  it("remembers the saved language", () => {
    saveLang("am");
    expect(loadLang()).toBe("am");
  });
});
