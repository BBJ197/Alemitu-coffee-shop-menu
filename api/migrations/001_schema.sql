-- Alemitu Digital Menu: schema (plain PostgreSQL)

create function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table categories (
  id uuid primary key default gen_random_uuid(),
  name_en text not null check (length(trim(name_en)) > 0),
  name_am text,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories (id) on delete restrict,
  name_en text not null check (length(trim(name_en)) > 0),
  name_am text,
  description_en text,
  description_am text,
  price_etb numeric(10, 2) not null check (price_etb > 0),
  image_path text,
  is_available boolean not null default true,
  is_featured boolean not null default false,
  available_from time,
  available_to time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint items_schedule_pair check ((available_from is null) = (available_to is null))
);

create table tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  group_key text not null check (group_key in ('fasting', 'diet', 'temperature')),
  name_en text not null check (length(trim(name_en)) > 0),
  name_am text,
  sort_order integer not null default 0
);

create table item_tags (
  item_id uuid not null references items (id) on delete cascade,
  tag_id uuid not null references tags (id) on delete cascade,
  primary key (item_id, tag_id)
);

create index items_category_id_idx on items (category_id);
create index item_tags_tag_id_idx on item_tags (tag_id);

create trigger categories_set_updated_at before update on categories
  for each row execute function set_updated_at();
create trigger items_set_updated_at before update on items
  for each row execute function set_updated_at();

-- Base tags: real configuration, editable from the admin later
insert into tags (slug, group_key, name_en, sort_order) values
  ('fasting', 'fasting', 'Fasting', 1),
  ('non-fasting', 'fasting', 'Non-fasting', 2),
  ('vegetarian', 'diet', 'Vegetarian', 1),
  ('hot', 'temperature', 'Hot', 1),
  ('cold', 'temperature', 'Cold', 2);