-- SEO landing pages (15/11/2026): one page per search intent (object, occasion, zone, B2B use case),
-- editable through the content API without a deployment. Rendered under /livraison, /transport, /entreprises.
create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  section text not null check (section in ('livraison', 'transport', 'entreprises')),
  title text not null,                  -- <title> / H1
  meta_description text,                -- <meta name="description">
  intro text,                           -- lead paragraph under the H1
  body text,                            -- markdown
  faq jsonb not null default '[]'::jsonb, -- [{q, a}] → FAQPage JSON-LD
  keyword text,                         -- the search intent the page targets (internal)
  order_prefill jsonb not null default '{}'::jsonb, -- {service, vehicule, from, to} → /commander?…
  related text[] not null default '{}', -- slugs of sibling pages (any section), rendered as internal links
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (section, slug)
);
create index if not exists pages_section_published_idx on public.pages (section, published, sort_order);

-- Data API grants (no defaults on new tables since 30/10/2026)
grant select on public.pages to anon, authenticated;
grant select, insert, update, delete on public.pages to service_role;

alter table public.pages enable row level security;
drop policy if exists "pages public read" on public.pages;
create policy "pages public read" on public.pages for select using (published = true);

create or replace function public.pages_set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists pages_updated_at on public.pages;
create trigger pages_updated_at before update on public.pages for each row execute function public.pages_set_updated_at();
