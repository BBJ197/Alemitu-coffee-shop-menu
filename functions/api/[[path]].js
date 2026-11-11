// Cloudflare Pages Function: forwards /api/* to the API host (set API_ORIGIN in Cloudflare).
// This keeps the browser on one address, so the admin login cookie works.
export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const target = new URL(url.pathname + url.search, env.API_ORIGIN);
  return fetch(new Request(target, request), { redirect: "manual" });
}
