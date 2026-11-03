-- Messages sent from the public "Contact us" form (read by the admin).

create table contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 100),
  email text not null check (length(email) between 3 and 254),
  message text not null check (length(trim(message)) between 1 and 2000),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index contact_messages_created_at_idx on contact_messages (created_at desc);