# Alemitu Coffee: Digital Menu

A QR-code digital menu with an admin dashboard for Alemitu Coffee.

- **Frontend:** React + TypeScript + Vite (`/`)
- **API:** Hono + PostgreSQL (`/api`)
- **Public pages:** `/` (landing) and `/menu` (the QR target, English / አማርኛ)
- **Admin:** `/admin` (items, photos, categories, tags, messages, QR code, settings)

## Requirements

- Node.js 20.19 or newer
- PostgreSQL 15 or newer

## Setup

```bash
# 1. Frontend
npm install
cp .env.example .env

# 2. API
cd api
npm install
cp .env.example .env      # then edit DATABASE_URL
npm run migrate           # creates the tables
npm run create-admin      # creates the single admin account (asks for email and password)
npm run seed              # optional: fake demo items (remove with: npm run unseed)
npm run dev               # API on http://localhost:3001

# 3. Frontend (in a second terminal, from the project root)
npm run dev               # site on http://localhost:5173
```

## Environment variables

| Variable             | Where    | Purpose                                                                            |
| -------------------- | -------- | ---------------------------------------------------------------------------------- |
| `VITE_API_URL`       | frontend | API base URL. Unset in development; in production, the deployed API address.       |
| `DATABASE_URL`       | api      | PostgreSQL connection string. Required.                                            |
| `PORT`               | api      | API port. Default `3001`.                                                          |
| `CORS_ORIGIN`        | api      | The exact URL of the deployed website. **Set this in production.**                 |
| `NODE_ENV`           | api      | Set to `production` so the session cookie is marked secure. **Set in production.** |
| `RESEND_API_KEY`     | api      | Optional. Emails contact-form messages to the owner.                               |
| `CONTACT_TO_EMAIL`   | api      | Optional. Who receives those emails.                                               |
| `CONTACT_FROM_EMAIL` | api      | Optional. Sender address.                                                          |

Never commit `.env` files. They are git-ignored; only the `.env.example` files are tracked.

## Commands

| Command                       | What it does                                                 |
| ----------------------------- | ------------------------------------------------------------ |
| `npm run lint`                | Lint the frontend                                            |
| `npm run typecheck`           | Type-check the frontend                                      |
| `npm test`                    | Frontend tests                                               |
| `npm run build`               | Production build into `dist/`                                |
| `npm run lhci`                | Lighthouse CI (build first; budgets in `lighthouserc.json`)  |
| `npm run e2e`                 | Playwright mobile end-to-end tests (run in CI; see below)    |
| `npm run format`              | Format all files with Prettier                               |
| `cd api && npm test`          | API tests (needs `DATABASE_URL` pointing at a test database) |
| `cd api && npm run typecheck` | Type-check the API                                           |

CI (GitHub Actions) runs format, lint, typecheck, tests and build for the frontend, the API tests against Postgres, and Lighthouse CI.

## Deploy

The site has two parts and both must be deployed.

### 1. API and database

Deploy `/api` to any Node host that offers PostgreSQL (for example Render, Railway or Fly.io).

1. Create a PostgreSQL database and copy its connection string.
2. Set the environment variables: `DATABASE_URL`, `CORS_ORIGIN` (your site URL), `NODE_ENV=production`.
3. Run `npm run migrate` once, then `npm run create-admin` once.
4. Start command: `npm start` inside `api/`. The API refuses to start if `NODE_ENV` and `CORS_ORIGIN` do not match (production needs a real site URL, a real site URL needs `NODE_ENV=production`).

### 2. Frontend (pick one)

Set `VITE_API_URL` to your API address in the host's environment settings. Build command `npm run build`, output folder `dist`.

- **Vercel:** import the repo. `vercel.json` already adds the SPA fallback and security headers.
- **Netlify:** import the repo. `netlify.toml` already sets build, publish folder and fallback.
- **Cloudflare Pages:** build command `npm run build`, output `dist`. Security headers come from `public/_headers`; without a 404.html file, Pages serves `index.html` for unknown routes automatically.

After deploying, open `/admin/qr`, confirm the address is your real `/menu` URL, and download the QR code.

## Security notes

- All `/api/admin/*` routes require an admin session (httpOnly, SameSite=Lax cookie, 7 days).
- Login and contact form are rate limited.
- Security headers and a Content-Security-Policy are set in `vercel.json` and `netlify.toml`.

## Admin guide

See [docs/ADMIN-GUIDE.md](docs/ADMIN-GUIDE.md).

## End-to-end tests

Playwright tests (`e2e/`) run on a mobile viewport against the real API and a Postgres database. They cover the customer menu (search, filter, language) and the admin flow (log in, create, edit, delete an item). They run automatically in GitHub Actions (`.github/workflows/e2e.yml`).

To run them locally, use a separate throwaway database (never your real one):

1. Set `DATABASE_URL` to that database, then in `api/` run `npm run migrate` and `npm run seed`.
2. Set `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD` (12+ characters), then in `api/` run `node --import tsx scripts/e2e-admin.ts`.
3. Once: `npx playwright install chromium`. Then: `npm run e2e`.
