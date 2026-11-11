# Database backups

A GitHub Actions workflow (`Database backup`) saves a copy of the Neon database every Sunday: menu, photos, admin account and customer messages.

## Set up (once)

1. On GitHub open the repo, then Settings, Secrets and variables, Actions, New repository secret.
2. Name: `NEON_DATABASE_URL`.
3. Value: the connection string from Neon that ends in `sslmode=require`. Use the original one from Neon, not the `verify-full` one used in Render.

## Run a backup now

Open the Actions tab, choose Database backup, then Run workflow. When it finishes, open the run and download the artifact named `alemitu-backup-...`. It is a zip file containing `alemitu-backup.dump`.

Backups are kept for 90 days. Once a month, download one to your computer and keep it somewhere safe. It contains the admin password hash and customer messages, so keep the repo private.

## Restore

1. Create a new empty Neon project.
2. With the PostgreSQL client tools installed, run:

       pg_restore --no-owner --no-privileges -d "NEW_NEON_CONNECTION_STRING" alemitu-backup.dump

3. In Render, set `DATABASE_URL` to the new connection string (with `sslmode=verify-full`) and redeploy.
