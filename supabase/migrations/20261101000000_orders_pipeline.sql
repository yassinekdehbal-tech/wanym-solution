-- WANYM SOLUTION — order pipeline: pricing, payment (Stripe), Namy sync,
-- after-sales (SAV) and invoicing fields, plus an event log per order.

-- Human-readable order reference: WS-2026-00001
create sequence if not exists public.orders_reference_seq;

alter table public.orders
  add column if not exists reference text unique
    default ('WS-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.orders_reference_seq')::text, 5, '0')),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists service_slug text,
  add column if not exists pickup_postal_code text,
  add column if not exists delivery_postal_code text,
  add column if not exists pickup_contact text,
  add column if not exists delivery_contact text,
  add column if not exists wanted_slot text,
  add column if not exists quantity_unit text,
  add column if not exists options jsonb not null default '{}'::jsonb,
  add column if not exists distance_km numeric,
  add column if not exists pricing_mode text not null default 'quote'
    check (pricing_mode in ('instant', 'quote')),
  add column if not exists price_cents integer,          -- HT
  add column if not exists vat_rate numeric not null default 20,
  add column if not exists total_cents integer,          -- TTC
  add column if not exists currency text not null default 'EUR',
  add column if not exists payment_status text not null default 'not_required'
    check (payment_status in ('not_required', 'pending', 'paid', 'failed', 'refunded')),
  add column if not exists stripe_session_id text,
  add column if not exists stripe_payment_intent text,
  add column if not exists paid_at timestamptz,
  add column if not exists namy_ref text,
  add column if not exists namy_synced_at timestamptz,
  add column if not exists invoice_number text,
  add column if not exists invoice_url text,
  add column if not exists invoiced_at timestamptz,
  add column if not exists utm jsonb,
  add column if not exists ip_hash text;

-- Wider status lifecycle (new → quoted → confirmed → in_progress → delivered | cancelled | sav)
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('new', 'quoted', 'confirmed', 'in_progress', 'delivered', 'cancelled', 'sav'));

create unique index if not exists orders_stripe_session_idx on public.orders (stripe_session_id) where stripe_session_id is not null;
create index if not exists orders_payment_status_idx on public.orders (payment_status);
create index if not exists orders_email_idx on public.orders (lower(email));

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- Event log: everything that happens to an order (payment, status, SAV, invoice, Namy sync…)
create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  created_at timestamptz not null default now(),
  type text not null
    check (type in ('created', 'payment', 'status', 'note', 'sav', 'invoice', 'namy', 'email')),
  message text,
  data jsonb,
  author text not null default 'system',   -- system | customer | api | namy
  public boolean not null default false    -- visible to the customer on /suivi
);
create index if not exists order_events_order_idx on public.order_events (order_id, created_at);

-- Pricing rules per service, editable through the API
create table if not exists public.pricing_rules (
  service_slug text primary key references public.services (slug) on update cascade,
  label text not null,
  instant_booking boolean not null default false, -- true: price shown + Stripe payment; false: quote within 24h
  base_cents integer not null default 0,
  per_km_cents integer not null default 0,
  per_unit_cents integer not null default 0,      -- per additional parcel/pallet beyond the first
  min_cents integer not null default 0,
  max_km integer,                                 -- beyond: fall back to quote
  max_units integer,                              -- beyond: fall back to quote
  vat_rate numeric not null default 20,
  surcharges jsonb not null default '{"handling": 1500, "floor": 2000, "urgent_pct": 25}'::jsonb,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);
drop trigger if exists pricing_rules_set_updated_at on public.pricing_rules;
create trigger pricing_rules_set_updated_at
  before update on public.pricing_rules
  for each row execute function public.set_updated_at();

-- RLS: nothing public on events; pricing rules readable (prices are shown on the site)
alter table public.order_events enable row level security;
alter table public.pricing_rules enable row level security;

drop policy if exists "pricing_rules public read" on public.pricing_rules;
create policy "pricing_rules public read" on public.pricing_rules
  for select to anon, authenticated using (active = true);

-- Orders are written only by the server (service role); drop the anon insert policy.
drop policy if exists "orders anon insert" on public.orders;
