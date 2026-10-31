-- WANYM SOLUTION — initial schema
-- services: editable offers shown on the site
-- site_content: key/value editable copy
-- orders: transport orders from /commander (fed by Google Ads traffic)

create extension if not exists pgcrypto;

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  summary text,
  body text,                      -- markdown
  icon text,
  sort_order int not null default 0,
  published boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.site_content (
  key text primary key,            -- e.g. hero.title, footer.phone
  value text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'new'
    check (status in ('new', 'quoted', 'confirmed', 'cancelled')),
  pickup_address text not null,
  delivery_address text not null,
  goods_type text,
  quantity text,
  dimensions text,
  weight_kg numeric,
  wanted_date date,
  company text,
  contact_name text not null,
  email text not null,
  phone text not null,
  notes text,
  source text,                     -- utm_source / utm_campaign
  gclid text                       -- Google Ads click id for conversion attribution
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists services_sort_idx on public.services (published, sort_order);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists services_set_updated_at on public.services;
create trigger services_set_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

drop trigger if exists site_content_set_updated_at on public.site_content;
create trigger site_content_set_updated_at
  before update on public.site_content
  for each row execute function public.set_updated_at();

-- RLS: public read on content, no public write. Orders: insert-only for anon,
-- nothing else. All writes to content go through API routes using the service key.
alter table public.services enable row level security;
alter table public.site_content enable row level security;
alter table public.orders enable row level security;

drop policy if exists "services public read" on public.services;
create policy "services public read" on public.services
  for select to anon, authenticated using (published = true);

drop policy if exists "site_content public read" on public.site_content;
create policy "site_content public read" on public.site_content
  for select to anon, authenticated using (true);

drop policy if exists "orders anon insert" on public.orders;
create policy "orders anon insert" on public.orders
  for insert to anon with check (true);
