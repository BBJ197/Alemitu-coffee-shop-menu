import { describe, expect, it } from "vitest";
import { AdminApiError } from "./api";
import { passwordErrorMessage, validateNewPassword } from "./passwordForm";

describe("validateNewPassword", () => {
  it("accepts a good password", () => {
    expect(
      validateNewPassword("old", "a-long-new-password", "a-long-new-password"),
    ).toBeNull();
  });

  it("rejects a short password", () => {
    expect(validateNewPassword("old", "short", "short")).toMatch(/at least 12/);
  });

  it("rejects reusing the current password", () => {
    const same = "the-same-password";
    expect(validateNewPassword(same, same, same)).toMatch(/different/);
  });

  it("rejects a mismatched confirmation", () => {
    expect(
      validateNewPassword("old", "a-long-new-password", "another-long-one"),
    ).toMatch(/don't match/);
  });
});

describe("passwordErrorMessage", () => {
  it("maps API codes to messages", () => {
    expect(
      passwordErrorMessage(new AdminApiError(403, "wrong_current_password")),
    ).toBe("The current password is incorrect.");
    expect(
      passwordErrorMessage(new AdminApiError(429, "too_many_attempts")),
    ).toMatch(/too many/i);
  });

  it("explains a network failure and falls back otherwise", () => {
    expect(passwordErrorMessage(new TypeError("Failed to fetch"))).toMatch(
      /can't reach/i,
    );
    expect(passwordErrorMessage(new AdminApiError(500, null))).toMatch(
      /wasn't changed/,
    );
  });
});
