-- Second part of the orders pipeline: statements that drop/replace constraints
-- (Supabase MCP asks for a confirmation on these, so they are kept apart and
-- can be run in the SQL editor in one go).

-- Wider status lifecycle (new → quoted → confirmed → in_progress → delivered | cancelled | sav)
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('new', 'quoted', 'confirmed', 'in_progress', 'delivered', 'cancelled', 'sav'));

-- Payment lifecycle (immediate charge at checkout; 'authorized' kept for compatibility).
alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders add constraint orders_payment_status_check
  check (payment_status in ('not_required', 'pending', 'authorized', 'paid', 'failed', 'refunded'));

-- Orders are written only by the server (service role); the anon insert policy is no longer needed.
drop policy if exists "orders anon insert" on public.orders;

-- Prices now come from NAMY's engine (grid of the « WANYM SOLUTION — Site web » account): the local rules are obsolete.
drop table if exists public.pricing_rules;
