# Handoff: v1.0.0

## What exists

- Public site: `/` landing and `/menu` (search, filters, EN/አማ, popular section, open/closed).
- Admin (`/admin`): items, photos, categories, tags, messages, QR code, password change.
- API (`/api`): Hono + PostgreSQL, session-cookie auth, rate-limited login and contact form.
- CI: format, lint, typecheck, tests, build, API tests, Lighthouse CI, Playwright e2e.

## Deploy-day checklist

1. Deploy the API with `DATABASE_URL`, `CORS_ORIGIN` (real site URL) and `NODE_ENV=production`. The API refuses to start if these do not match.
2. Run `npm run migrate`, then `npm run create-admin` once (inside `api/`).
3. Deploy the frontend with `VITE_API_URL` set to the API address.
4. Open `/admin/qr`, check the address, download the PNG or SVG and print it.

## Known follow-ups (not blockers)

- The deploy steps in the README have not been tested on a real host yet.

## Docs

README (setup, variables, commands, deploy) and `docs/ADMIN-GUIDE.md` (staff guide).
