import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, fetchMenu } from "./menu";

afterEach(() => vi.unstubAllGlobals());

describe("fetchMenu", () => {
  it("requests /api/menu and returns the parsed menu", async () => {
    const menu = { categories: [], items: [], tags: [] };
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: async () => menu });
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchMenu()).resolves.toEqual(menu);
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/api\/menu$/);
  });

  it("throws an ApiError carrying the status on a failed response", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }),
    );

    const error = await fetchMenu().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(500);
  });

  it("propagates network failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );
    await expect(fetchMenu()).rejects.toThrow("Failed to fetch");
  });
});
