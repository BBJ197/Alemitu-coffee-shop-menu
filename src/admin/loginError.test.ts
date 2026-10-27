import { describe, expect, it } from "vitest";
import { AdminApiError } from "./api";
import { loginErrorMessage } from "./loginError";

describe("loginErrorMessage", () => {
  it("explains wrong credentials", () => {
    expect(
      loginErrorMessage(new AdminApiError(401, "invalid_credentials")),
    ).toBe("The email or password is incorrect.");
  });

  it("explains the rate limit", () => {
    expect(
      loginErrorMessage(new AdminApiError(429, "too_many_attempts")),
    ).toMatch(/too many failed attempts/i);
  });

  it("explains a blocked origin", () => {
    expect(loginErrorMessage(new AdminApiError(403, "forbidden"))).toMatch(
      /address/i,
    );
  });

  it("explains a network failure", () => {
    expect(loginErrorMessage(new TypeError("Failed to fetch"))).toMatch(
      /can't reach the server/i,
    );
  });

  it("falls back to a generic message", () => {
    expect(loginErrorMessage(new AdminApiError(500, null))).toMatch(
      /sign-in failed/i,
    );
    expect(loginErrorMessage("nope")).toMatch(/sign-in failed/i);
  });
});
