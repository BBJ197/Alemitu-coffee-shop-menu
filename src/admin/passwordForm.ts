import { AdminApiError } from "./api";

export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 200;

/** Returns a message for the first problem, or null when the form is valid. */
export function validateNewPassword(
  current: string,
  next: string,
  confirm: string,
): string | null {
  if (next.length < MIN_PASSWORD_LENGTH)
    return `The new password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (next.length > MAX_PASSWORD_LENGTH)
    return `The new password must be ${MAX_PASSWORD_LENGTH} characters or fewer.`;
  if (next === current)
    return "The new password must be different from the current one.";
  if (next !== confirm) return "The new passwords don't match.";
  return null;
}

export function passwordErrorMessage(error: unknown): string {
  if (error instanceof AdminApiError) {
    if (error.code === "wrong_current_password")
      return "The current password is incorrect.";
    if (error.code === "too_many_attempts")
      return "Too many failed attempts. Wait a few minutes, then try again.";
    if (error.code === "weak_password")
      return `The new password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    if (error.code === "same_password")
      return "The new password must be different from the current one.";
  }
  if (error instanceof TypeError)
    return "Can't reach the server. Check your connection and try again.";
  return "The password wasn't changed. Try again in a moment.";
}
