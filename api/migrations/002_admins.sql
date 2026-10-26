-- Admin accounts and server-side sessions (M4.1)

create table admins (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(trim(email)) and length(email) > 3),
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table sessions (
  token_hash text primary key,
  admin_id uuid not null references admins (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index sessions_admin_id_idx on sessions (admin_id);
create index sessions_expires_at_idx on sessions (expires_at);