/** Base URL of the API. Empty in production builds when the API shares the site's origin. */
export const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:3001" : "");
