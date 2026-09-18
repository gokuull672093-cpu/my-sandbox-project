-- ============================================================================
-- Upcurv Crackers — Digital Catalogue & Enquiry Management System
-- Complete single-run database setup for a NEW Supabase project.
--
-- How to use for a new store:
--   1. Create a fresh Supabase project.
--   2. Open SQL Editor → paste this whole file → Run.
--   3. Create the seller login under Authentication → Users.
--   4. Create a private storage bucket named "product-images" (10 MB limit)
--      in the dashboard, then run the storage policy block at the bottom.
--   5. Update the shop details in src/lib/shop.ts (see the Guide page).
--
-- Everything below is idempotent-friendly and ordered by dependency.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Types
-- ----------------------------------------------------------------------------
do $$ begin
  create type public.availability_status as enum ('available', 'limited', 'unavailable', 'enquiry_only');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.enquiry_status as enum (
    'new', 'contact_required', 'contacted', 'discussion',
    'confirmed', 'ready', 'completed', 'not_converted'
  );
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- 2. Shared helper functions
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create sequence if not exists public.enquiry_ref_seq start 1000;

create or replace function public.gen_enquiry_ref()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.ref is null or new.ref = '' then
    new.ref := 'UC-26-' || nextval('public.enquiry_ref_seq')::text;
  end if;
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 3. Catalogue
-- ----------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  name_ta text,
  experience text,
  emoji text,
  image_url text,
  sort integer not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.categories to anon;
grant select, insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "categories public read" on public.categories for select to anon using (true);
create policy "categories admin all" on public.categories for all to authenticated using (true) with check (true);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  name_ta text,
  category_id uuid references public.categories(id) on delete set null,
  pack text,
  mrp numeric,
  price numeric not null default 0,
  deal_price numeric,
  availability public.availability_status not null default 'available',
  image_url text,
  tags text[] not null default '{}',
  addon_rank integer,
  deal_rank integer,
  popular_rank integer,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "products public read" on public.products for select to anon using (active);
create policy "products admin all" on public.products for all to authenticated using (true) with check (true);

create table if not exists public.combos (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  title_ta text,
  description text,
  indicative_price numeric not null default 0,
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.combos to anon;
grant select, insert, update, delete on public.combos to authenticated;
grant all on public.combos to service_role;
alter table public.combos enable row level security;
create policy "combos public read" on public.combos for select to anon using (active);
create policy "combos admin all" on public.combos for all to authenticated using (true) with check (true);

create table if not exists public.combo_items (
  id uuid primary key default gen_random_uuid(),
  combo_id uuid not null references public.combos(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  qty integer not null default 1
);
grant select on public.combo_items to anon;
grant select, insert, update, delete on public.combo_items to authenticated;
grant all on public.combo_items to service_role;
alter table public.combo_items enable row level security;
create policy "combo_items public read" on public.combo_items for select to anon using (true);
create policy "combo_items admin all" on public.combo_items for all to authenticated using (true) with check (true);

-- ----------------------------------------------------------------------------
-- 4. Coupons
-- ----------------------------------------------------------------------------
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text,
  discount_type text not null default 'percent',
  value numeric not null default 0,
  min_value numeric not null default 0,
  max_discount numeric,
  active boolean not null default true,
  expires_at timestamptz,
  used_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.coupons to anon;
grant select, insert, update, delete on public.coupons to authenticated;
grant all on public.coupons to service_role;
alter table public.coupons enable row level security;
create policy "coupons public read" on public.coupons for select to anon using (active);
create policy "coupons admin all" on public.coupons for all to authenticated using (true) with check (true);
create trigger coupons_set_updated_at before update on public.coupons
for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 5. Enquiries
-- ----------------------------------------------------------------------------
create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  ref text,
  name text not null,
  mobile text not null,
  city text not null,
  state text,
  address text,
  pincode text,
  fulfilment text,
  contact_method text,
  message text,
  free_text text,
  source text not null default 'direct',
  status public.enquiry_status not null default 'new',
  estimated_value numeric not null default 0,
  final_amount numeric,
  delivery_charge numeric not null default 0,
  coupon_code text,
  discount_amount numeric not null default 0,
  item_count integer not null default 0,
  follow_up_at timestamptz,
  seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.enquiries to authenticated;
grant insert on public.enquiries to anon;
grant all on public.enquiries to service_role;
alter table public.enquiries enable row level security;
create policy "enquiries public insert" on public.enquiries for insert to anon with check (true);
create policy "enquiries admin all" on public.enquiries for all to authenticated using (true) with check (true);
create trigger enquiries_ref before insert on public.enquiries
for each row execute function public.gen_enquiry_ref();
create trigger enquiries_updated_at before update on public.enquiries
for each row execute function public.set_updated_at();

create table if not exists public.enquiry_items (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references public.enquiries(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_code text,
  product_name text not null,
  qty integer not null default 1,
  unit_price numeric not null default 0,
  removed boolean not null default false
);
grant select, insert, update, delete on public.enquiry_items to authenticated;
grant insert on public.enquiry_items to anon;
grant all on public.enquiry_items to service_role;
alter table public.enquiry_items enable row level security;
create policy "enquiry_items public insert" on public.enquiry_items for insert to anon with check (true);
create policy "enquiry_items admin all" on public.enquiry_items for all to authenticated using (true) with check (true);

create table if not exists public.enquiry_notes (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references public.enquiries(id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.enquiry_notes to authenticated;
grant all on public.enquiry_notes to service_role;
alter table public.enquiry_notes enable row level security;
create policy "notes admin all" on public.enquiry_notes for all to authenticated using (true) with check (true);

-- ----------------------------------------------------------------------------
-- 6. Payments
-- ----------------------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references public.enquiries(id) on delete cascade,
  amount numeric not null default 0,
  method text not null default 'cash',
  reference text,
  note text,
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.payments to authenticated;
grant all on public.payments to service_role;
alter table public.payments enable row level security;
create policy "payments admin all" on public.payments for all to authenticated using (true) with check (true);
create trigger payments_set_updated_at before update on public.payments
for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 7. Operations: settings, analytics, activity log, sticky notes
-- ----------------------------------------------------------------------------
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.app_settings to anon;
grant select, insert, update, delete on public.app_settings to authenticated;
grant all on public.app_settings to service_role;
alter table public.app_settings enable row level security;
create policy "app_settings public read" on public.app_settings for select to anon using (true);
create policy "app_settings admin all" on public.app_settings for all to authenticated using (true) with check (true);
create trigger app_settings_set_updated_at before update on public.app_settings
for each row execute function public.set_updated_at();

create table if not exists public.site_events (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  session_id text not null,
  path text,
  product_id uuid,
  product_name text,
  qty integer not null default 0,
  value numeric not null default 0,
  source text not null default 'direct',
  created_at timestamptz not null default now()
);
grant insert on public.site_events to anon;
grant select, insert, update, delete on public.site_events to authenticated;
grant all on public.site_events to service_role;
alter table public.site_events enable row level security;
create policy "site_events public insert" on public.site_events for insert to anon with check (true);
create policy "site_events admin all" on public.site_events for all to authenticated using (true) with check (true);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  entity text not null,
  entity_id uuid,
  entity_label text,
  action text not null,
  field text,
  old_value text,
  new_value text,
  detail text,
  actor text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;
alter table public.audit_logs enable row level security;
create policy "audit_logs admin all" on public.audit_logs for all to authenticated using (true) with check (true);

create table if not exists public.sticky_notes (
  id uuid primary key default gen_random_uuid(),
  body text not null default '',
  color text not null default 'yellow',
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.sticky_notes to authenticated;
grant all on public.sticky_notes to service_role;
alter table public.sticky_notes enable row level security;
create policy "sticky_notes admin all" on public.sticky_notes for all to authenticated using (true) with check (true);
create trigger sticky_notes_set_updated_at before update on public.sticky_notes
for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 8. Helpful indexes
-- ----------------------------------------------------------------------------
create index if not exists products_category_idx on public.products (category_id);
create index if not exists enquiries_created_idx on public.enquiries (created_at desc);
create index if not exists enquiries_status_idx on public.enquiries (status);
create index if not exists enquiry_items_enquiry_idx on public.enquiry_items (enquiry_id);
create index if not exists payments_enquiry_idx on public.payments (enquiry_id);
create index if not exists site_events_created_idx on public.site_events (created_at desc);
create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);

-- ----------------------------------------------------------------------------
-- 9. Storage policies (run AFTER creating the private "product-images" bucket)
-- ----------------------------------------------------------------------------
create policy "product images seller read" on storage.objects
  for select to authenticated using (bucket_id = 'product-images');
create policy "product images seller write" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images');
create policy "product images seller update" on storage.objects
  for update to authenticated using (bucket_id = 'product-images');
create policy "product images seller delete" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images');

-- ----------------------------------------------------------------------------
-- 10. Starter data (optional — delete this block if not wanted)
-- ----------------------------------------------------------------------------
insert into public.app_settings (key, value)
values ('order', '{"min_order_value": 0}'::jsonb)
on conflict (key) do nothing;

insert into public.coupons (code, label, discount_type, value, min_value, max_discount)
values
  ('DIWALI10', '10% off on orders above 2000', 'percent', 10, 2000, 500),
  ('FIRST250', 'Flat 250 off on orders above 2500', 'flat', 250, 2500, null)
on conflict (code) do nothing;
