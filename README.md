# Alemitu Coffee: Digital Menu

A QR-code digital menu with an admin dashboard for Alemitu Coffee.

**Live site:** https://alemitu-coffee.pages.dev (menu: [/menu](https://alemitu-coffee.pages.dev/menu), admin: [/admin](https://alemitu-coffee.pages.dev/admin))

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

| Variable             | Where            | Purpose                                                                            |
| -------------------- | ---------------- | ---------------------------------------------------------------------------------- |
| `VITE_API_URL`       | frontend         | Leave unset in production (the site calls `/api` on its own address).              |
| `API_ORIGIN`         | Cloudflare Pages | The Render API address that `/api/*` is forwarded to.                              |
| `DATABASE_URL`       | api              | PostgreSQL connection string. Required.                                            |
| `PORT`               | api              | API port. Default `3001`.                                                          |
| `CORS_ORIGIN`        | api              | The exact URL of the deployed website. **Set this in production.**                 |
| `NODE_ENV`           | api              | Set to `production` so the session cookie is marked secure. **Set in production.** |
| `RESEND_API_KEY`     | api              | Optional. Emails contact-form messages to the owner.                               |
| `CONTACT_TO_EMAIL`   | api              | Optional. Who receives those emails.                                               |
| `CONTACT_FROM_EMAIL` | api              | Optional. Sender address.                                                          |

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

The live site runs entirely on free tiers (no card needed):

| Part     | Service                                          | What it does                                                                                                  |
| -------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Website  | [Cloudflare Pages](https://pages.cloudflare.com) | Serves the React site worldwide. A Pages Function (`functions/api/[[path]].js`) forwards `/api/*` to the API. |
| API      | [Render](https://render.com) (free web service)  | Runs the `api/` folder.                                                                                       |
| Database | [Neon](https://neon.com) (free Postgres)         | Stores the menu, admin account and photos. Region: Frankfurt.                                                 |
| Uptime   | [UptimeRobot](https://uptimerobot.com) (free)    | Pings the API every 5 minutes so Render does not fall asleep, and emails if the site goes down.               |

Why the forwarding file exists: the website and the API live on different free domains, and browsers refuse to send the admin login cookie between unrelated domains. Forwarding `/api` through the website keeps everything on one address.

### 1. Database (Neon)

1. Create a project in Frankfurt and copy the **non-pooled** connection string. Use `sslmode=verify-full`.
2. From your computer, inside `api/`:

```bash
export DATABASE_URL='your-neon-string'
node scripts/migrate.mjs
node --import tsx scripts/create-admin.ts
unset DATABASE_URL
```

Do not run `npm run seed` in production (it adds fake demo items).

### 2. API (Render)

New Web Service from the GitHub repo with these settings:

- Root Directory `api`, Build Command `npm ci`, Start Command `npm start`, Instance Type Free, Region Frankfurt
- Health Check Path `/api/health`
- Environment variables: `DATABASE_URL`, `NODE_ENV=production`, `CORS_ORIGIN=https://alemitu-coffee.pages.dev`, `NODE_VERSION=22`

The API refuses to start if `NODE_ENV` and `CORS_ORIGIN` do not match.

### 3. Website (Cloudflare Pages)

Create a Pages project from the GitHub repo (production branch `main`) with these settings:

- Framework preset None, Build command `npm run build`, Build output directory `dist`
- Environment variables: `NODE_VERSION=22` and `API_ORIGIN` set to the Render address (no trailing slash)
- Do not set `VITE_API_URL`; the site calls `/api` on its own address.

Both Render and Cloudflare redeploy automatically when `main` changes.

### 4. Keep the API awake (UptimeRobot)

Add two HTTP monitors with a 5-minute interval: the Render address plus `/api/health`, and `https://alemitu-coffee.pages.dev/api/health`.

### Limits of the free setup

- If monitoring stops, Render sleeps after 15 minutes and the first visitor waits about a minute.
- Neon sleeps when idle, so the first request after a quiet spell takes about a second longer.
- Neon's free database is 0.5 GB with no automatic backups.
- Moving to a custom domain later: point the domain at Cloudflare Pages and update `CORS_ORIGIN` in Render to the new address.

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
