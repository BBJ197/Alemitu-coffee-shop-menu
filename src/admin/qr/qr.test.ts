import { describe, expect, it } from "vitest";
import { isLocalAddress, makeQrSvg, normalizeMenuUrl, svgDataUrl } from "./qr";

describe("normalizeMenuUrl", () => {
  it("keeps a full address", () => {
    expect(normalizeMenuUrl("https://alemitu.example/menu")).toBe(
      "https://alemitu.example/menu",
    );
  });

  it("adds https:// when it is missing, and trims spaces", () => {
    expect(normalizeMenuUrl("  alemitu.example/menu ")).toBe(
      "https://alemitu.example/menu",
    );
  });

  it("accepts localhost for testing", () => {
    expect(normalizeMenuUrl("http://localhost:5173/menu")).toBe(
      "http://localhost:5173/menu",
    );
  });

  it("rejects text that is not a web address", () => {
    for (const bad of [
      "",
      "   ",
      "hello",
      "two words.com",
      "ftp://x.com/a",
      "javascript:alert(1)",
    ])
      expect(normalizeMenuUrl(bad)).toBeNull();
  });
});

describe("isLocalAddress", () => {
  it("spots addresses that only work on this computer or network", () => {
    for (const local of [
      "http://localhost:5173/menu",
      "http://127.0.0.1/menu",
      "http://192.168.1.20:5173/menu",
      "http://10.0.0.5/menu",
      "http://172.20.1.1/menu",
      "http://cafe.local/menu",
    ])
      expect(isLocalAddress(local)).toBe(true);
    expect(isLocalAddress("https://alemitu.example/menu")).toBe(false);
    expect(isLocalAddress("http://172.32.0.1/menu")).toBe(false);
  });
});

describe("makeQrSvg", () => {
  it("draws an SVG QR code", async () => {
    const svg = await makeQrSvg("https://alemitu.example/menu");
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svgDataUrl(svg).startsWith("data:image/svg+xml")).toBe(true);
  });
});
