import { AdminApiError } from "./api";

/** Turns a failed sign-in into a message that says what happened and what to do. */
export function loginErrorMessage(error: unknown): string {
  if (error instanceof AdminApiError) {
    if (error.code === "invalid_credentials")
      return "The email or password is incorrect.";
    if (error.code === "too_many_attempts")
      return "Too many failed attempts. Wait a few minutes, then try again.";
    if (error.code === "forbidden")
      return "The server rejected this site's address. Open the site from the address the server allows.";
    return "Sign-in failed. Try again in a moment.";
  }
  if (error instanceof TypeError)
    return "Can't reach the server. Check your connection and try again.";
  return "Sign-in failed. Try again in a moment.";
}
