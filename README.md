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
4. Start command: `npm run dev` inside `api/` runs the server; use the same entry (`src/server.ts`) with `NODE_ENV=production`.

### 2. Frontend (pick one)

Set `VITE_API_URL` to your API address in the host's environment settings. Build command `npm run build`, output folder `dist`.

- **Vercel:** import the repo. `vercel.json` already adds the SPA fallback and security headers.
- **Netlify:** import the repo. `netlify.toml` already sets build, publish folder and fallback.
- **Cloudflare Pages:** framework preset "Vite" (or build `npm run build`, output `dist`). Headers and fallback come from the files in `public/` if present; otherwise add a `_redirects` rule `/* /index.html 200`.

After deploying, open `/admin/qr`, confirm the address is your real `/menu` URL, and download the QR code.

## Security notes

- All `/api/admin/*` routes require an admin session (httpOnly, SameSite=Lax cookie, 7 days).
- Login and contact form are rate limited.
- Security headers and a Content-Security-Policy are set in `vercel.json` and `netlify.toml`.

## Admin guide

See [docs/ADMIN-GUIDE.md](docs/ADMIN-GUIDE.md).
