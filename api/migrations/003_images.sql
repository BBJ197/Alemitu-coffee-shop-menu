-- Item photos (M5): stored in the database so they survive redeploys.
-- The browser resizes and converts to WebP before upload; the API re-checks.

create table images (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type = 'image/webp'),
  byte_size integer not null check (byte_size > 0 and byte_size <= 400000),
  data bytea not null,
  created_at timestamptz not null default now()
);
