import { describe, expect, it } from "vitest";
import { menuQueryOptions } from "./useMenu";

describe("menuQueryOptions", () => {
  it("retries once, quickly, so errors appear fast", () => {
    expect(menuQueryOptions.retry).toBe(1);
    expect(menuQueryOptions.retryDelay).toBe(700);
  });

  it("caches the menu for 30 seconds", () => {
    expect(menuQueryOptions.staleTime).toBe(30_000);
    expect(menuQueryOptions.queryKey).toEqual(["menu"]);
  });
});
