-- =====================================================================
-- SHANTIES COLLECTION — complete database setup (run ONCE in the Supabase SQL Editor)
-- Safe to re-run: uses IF NOT EXISTS / ON CONFLICT where possible.
-- =====================================================================

create extension if not exists pg_trgm;

create or replace function public.sc_slugify(t text) returns text
language sql immutable as $$
  select trim(both '-' from regexp_replace(
    regexp_replace(replace(lower(t), '&', ' '), '[''’]', '', 'g'),
    '[^a-z0-9]+', '-', 'g'))
$$;

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ---------------------------------------------------------------- USERS
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  email text,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone', new.email)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
$$;

-- ----------------------------------------------------------- CATALOGUE
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  slug text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (category_id, slug)
);
create index if not exists subcategories_category_idx on public.subcategories(category_id);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  details text,
  specifications jsonb not null default '[]'::jsonb,
  price numeric(12,2) not null check (price >= 0),
  previous_price numeric(12,2) check (previous_price is null or previous_price >= 0),
  stock_quantity int not null default 0 check (stock_quantity >= 0),
  category_id uuid references public.categories(id) on delete set null,
  subcategory_id uuid references public.subcategories(id) on delete set null,
  keywords text,
  rating_avg numeric(3,2) not null default 0,
  review_count int not null default 0,
  is_featured boolean not null default false,
  featured_order int not null default 0,
  is_popular boolean not null default false,
  popular_order int not null default 0,
  is_active boolean not null default true,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_category_idx on public.products(category_id) where is_active;
create index if not exists products_subcategory_idx on public.products(subcategory_id) where is_active;
create index if not exists products_featured_idx on public.products(featured_order) where is_featured and is_active;
create index if not exists products_popular_idx on public.products(popular_order) where is_popular and is_active;
create index if not exists products_created_idx on public.products(created_at desc);
create index if not exists products_price_idx on public.products(price);
create index if not exists products_name_trgm on public.products using gin (name gin_trgm_ops);
create index if not exists products_keywords_trgm on public.products using gin (keywords gin_trgm_ops);
drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  storage_path text,
  alt text,
  sort_order int not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists product_images_product_idx on public.product_images(product_id, sort_order);

-- ---------------------------------------------------------------- CART
create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity int not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (cart_id, product_id)
);

-- ------------------------------------------------- ADDRESSES & DELIVERY
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text,
  full_name text not null,
  phone text not null,
  county text not null,
  town text not null,
  area text,
  address_details text,
  notes text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists addresses_user_idx on public.addresses(user_id);

create table if not exists public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  county text not null,
  town text,
  fee numeric(12,2) not null default 0 check (fee >= 0),
  eta text,
  is_enabled boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------------- ORDERS
create sequence if not exists public.order_number_seq start 1001;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('SC-' || lpad(nextval('public.order_number_seq')::text, 6, '0')),
  user_id uuid references public.profiles(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  delivery_county text not null,
  delivery_town text not null,
  delivery_area text,
  delivery_address text,
  delivery_notes text,
  delivery_zone_id uuid references public.delivery_zones(id) on delete set null,
  subtotal numeric(12,2) not null,
  delivery_fee numeric(12,2) not null default 0,
  total numeric(12,2) not null,
  payment_method text check (payment_method in ('mpesa_stk','mpesa_manual')),
  payment_status text not null default 'pending_payment'
    check (payment_status in ('pending_payment','payment_processing','paid','payment_failed','payment_cancelled','payment_refunded')),
  payment_reference text,
  order_status text not null default 'order_placed'
    check (order_status in ('order_placed','payment_confirmed','processing','ready_for_delivery','out_for_delivery','delivered','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_user_idx on public.orders(user_id, created_at desc);
create index if not exists orders_status_idx on public.orders(order_status, payment_status);
create index if not exists orders_created_idx on public.orders(created_at desc);
drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  price numeric(12,2) not null,
  quantity int not null check (quantity > 0),
  image_url text
);
create index if not exists order_items_order_idx on public.order_items(order_id);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  method text not null check (method in ('mpesa_stk','mpesa_manual')),
  phone text,
  amount numeric(12,2) not null,
  status text not null default 'initiated'
    check (status in ('initiated','pending','success','failed','cancelled','refunded')),
  merchant_request_id text,
  checkout_request_id text,
  mpesa_receipt text,
  result_code int,
  result_desc text,
  raw_callback jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists payments_checkout_request_idx on public.payments(checkout_request_id) where checkout_request_id is not null;
create unique index if not exists payments_receipt_idx on public.payments(mpesa_receipt) where mpesa_receipt is not null;
create index if not exists payments_order_idx on public.payments(order_id);
drop trigger if exists payments_updated_at on public.payments;
create trigger payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

-- ------------------------------------------------- REVIEWS & WISHLISTS
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  author_name text,
  rating int not null check (rating between 1 and 5),
  comment text,
  is_approved boolean not null default true,
  created_at timestamptz not null default now(),
  unique (product_id, user_id)
);
create index if not exists reviews_product_idx on public.reviews(product_id) where is_approved;

create or replace function public.refresh_product_rating() returns trigger
language plpgsql security definer set search_path = public as $$
declare pid uuid := coalesce(new.product_id, old.product_id);
begin
  update public.products p set
    rating_avg = coalesce((select round(avg(rating)::numeric, 2) from public.reviews where product_id = pid and is_approved), 0),
    review_count = (select count(*) from public.reviews where product_id = pid and is_approved)
  where p.id = pid;
  return null;
end $$;
drop trigger if exists reviews_rating on public.reviews;
create trigger reviews_rating after insert or update or delete on public.reviews
  for each row execute function public.refresh_product_rating();

create table if not exists public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  wishlist_id uuid not null references public.wishlists(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (wishlist_id, product_id)
);

-- ------------------------------------------- HOMEPAGE & STORE SETTINGS
create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  image_url text,
  storage_path text,
  title text,
  subtitle text,
  button_text text,
  button_link text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.homepage_sections (
  key text primary key,
  title text,
  subtitle text,
  button_text text,
  button_link text,
  image_url text,
  sort_order int not null default 0,
  is_enabled boolean not null default true
);

-- key/value store for everything the owner edits. is_public rows may be read by the storefront.
-- NEVER put M-Pesa API secrets here — those live in server environment variables only.
create table if not exists public.admin_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  updated_at timestamptz not null default now()
);

-- =========================================================== SECURITY
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.subcategories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.addresses enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;
alter table public.wishlists enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.banners enable row level security;
alter table public.homepage_sections enable row level security;
alter table public.admin_settings enable row level security;

-- Customers may edit ONLY their name and phone (never their role).
revoke update on public.profiles from authenticated, anon;
grant update (full_name, phone) on public.profiles to authenticated;

do $$
declare t text;
begin
  -- admin has full access everywhere
  foreach t in array array['profiles','categories','subcategories','products','product_images','carts','cart_items',
    'addresses','delivery_zones','orders','order_items','payments','reviews','wishlists','wishlist_items',
    'banners','homepage_sections','admin_settings'] loop
    execute format('drop policy if exists "admin all" on public.%I', t);
    execute format('create policy "admin all" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- public storefront reads
drop policy if exists "public read" on public.categories;
create policy "public read" on public.categories for select using (is_active);
drop policy if exists "public read" on public.subcategories;
create policy "public read" on public.subcategories for select using (is_active);
drop policy if exists "public read" on public.products;
create policy "public read" on public.products for select using (is_active);
drop policy if exists "public read" on public.product_images;
create policy "public read" on public.product_images for select using (true);
drop policy if exists "public read" on public.delivery_zones;
create policy "public read" on public.delivery_zones for select using (is_enabled);
drop policy if exists "public read" on public.banners;
create policy "public read" on public.banners for select using (is_active);
drop policy if exists "public read" on public.homepage_sections;
create policy "public read" on public.homepage_sections for select using (true);
drop policy if exists "public read" on public.reviews;
create policy "public read" on public.reviews for select using (is_approved);
drop policy if exists "public read" on public.admin_settings;
create policy "public read" on public.admin_settings for select using (is_public);

-- customer-owned data
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "own cart" on public.carts;
create policy "own cart" on public.carts for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "own cart items" on public.cart_items;
create policy "own cart items" on public.cart_items for all to authenticated
  using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()));

drop policy if exists "own addresses" on public.addresses;
create policy "own addresses" on public.addresses for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- orders/payments are written only by the server (service role). Customers can read their own orders.
drop policy if exists "own orders" on public.orders;
create policy "own orders" on public.orders for select to authenticated using (user_id = auth.uid());
drop policy if exists "own order items" on public.order_items;
create policy "own order items" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

drop policy if exists "own reviews insert" on public.reviews;
create policy "own reviews insert" on public.reviews for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "own reviews update" on public.reviews;
create policy "own reviews update" on public.reviews for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own wishlist" on public.wishlists;
create policy "own wishlist" on public.wishlists for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "own wishlist items" on public.wishlist_items;
create policy "own wishlist items" on public.wishlist_items for all to authenticated
  using (exists (select 1 from public.wishlists w where w.id = wishlist_id and w.user_id = auth.uid()))
  with check (exists (select 1 from public.wishlists w where w.id = wishlist_id and w.user_id = auth.uid()));

-- ============================================================ STORAGE
-- Public buckets: anyone can VIEW images; only admins can upload/replace/delete.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('products', 'products', true, 5242880, array['image/jpeg','image/png','image/webp']),
  ('banners',  'banners',  true, 5242880, array['image/jpeg','image/png','image/webp']),
  ('branding', 'branding', true, 2097152, array['image/jpeg','image/png','image/webp','image/svg+xml','image/x-icon','image/vnd.microsoft.icon'])
on conflict (id) do nothing;

drop policy if exists "admin upload images" on storage.objects;
create policy "admin upload images" on storage.objects for insert to authenticated
  with check (bucket_id in ('products','banners','branding') and public.is_admin());
drop policy if exists "admin update images" on storage.objects;
create policy "admin update images" on storage.objects for update to authenticated
  using (bucket_id in ('products','banners','branding') and public.is_admin());
drop policy if exists "admin delete images" on storage.objects;
create policy "admin delete images" on storage.objects for delete to authenticated
  using (bucket_id in ('products','banners','branding') and public.is_admin());
drop policy if exists "admin list images" on storage.objects;
create policy "admin list images" on storage.objects for select to authenticated
  using (bucket_id in ('products','banners','branding') and public.is_admin());

-- ================================================================ SEED
-- Only the categories requested for Shanties Collection.
do $$
declare
  cat jsonb; sub text; ci int := 0; si int; cid uuid;
begin
  for cat in select * from jsonb_array_elements($j$[
    {"name":"Fashion","subs":["Men's Clothing","Women's Clothing","Children's Clothing","Shoes","Bags","Watches","Jewellery","Sunglasses","Fashion Accessories"]},
    {"name":"Beauty & Personal Care","subs":["Skincare","Hair Care","Hair Extensions & Wigs","Makeup","Fragrances","Men's Grooming","Bath & Body","Oral Care","Beauty Accessories"]},
    {"name":"Electronics","subs":["Home Audio","Smart Watches","Electronic Accessories","Other Electronics"]},
    {"name":"Home & Kitchen","subs":["Furniture","Kitchen Appliances","Cookware","Dining","Bedding","Curtains","Home Decor","Lighting","Storage & Organization","Cleaning","Bathroom"]},
    {"name":"Appliances","subs":["Refrigerators","Washing Machines","Cookers","Microwaves","Blenders","Air Fryers","Kettles","Irons","Fans","Air Conditioners"]},
    {"name":"Baby & Kids","subs":["Baby Clothing","Diapers","Feeding","Baby Care","Baby Strollers","Car Seats","Toys","Learning","Kids Accessories"]}
  ]$j$::jsonb) loop
    ci := ci + 1;
    insert into public.categories (name, slug, sort_order)
      values (cat->>'name', public.sc_slugify(cat->>'name'), ci)
      on conflict (slug) do nothing;
    select id into cid from public.categories where slug = public.sc_slugify(cat->>'name');
    si := 0;
    for sub in select jsonb_array_elements_text(cat->'subs') loop
      si := si + 1;
      insert into public.subcategories (category_id, name, slug, sort_order)
        values (cid, sub, public.sc_slugify(sub), si)
        on conflict (category_id, slug) do nothing;
    end loop;
  end loop;
end $$;

insert into public.admin_settings (key, value, is_public) values
  ('store',    '{"name":"Shanties Collection","description":"Fashion, beauty, home and family essentials delivered across Kenya. Pay easily with M-Pesa."}', true),
  ('contact',  '{"phone":"","whatsapp":"","email":"","address":"","hours":""}', true),
  ('social',   '{"facebook":"","instagram":"","tiktok":"","x":"","youtube":""}', true),
  ('payments', '{"stk_enabled":true,"manual_enabled":true,"paybill":"","till":"","business_phone":""}', true)
on conflict (key) do nothing;

insert into public.homepage_sections (key, title, subtitle, button_text, button_link, sort_order) values
  ('categories', 'Shop by category', null, null, null, 1),
  ('featured',   'Featured products', null, null, null, 2),
  ('popular',    'Popular right now', null, null, null, 3),
  ('promo',      'Shopping across Kenya, made simple', 'Pay with M-Pesa and get your order delivered to your door.', 'Start shopping', '/categories', 4)
on conflict (key) do nothing;

insert into public.banners (title, subtitle, button_text, button_link, sort_order)
select * from (values
  ('New collection', 'Discover our latest products', 'Shop now', '/categories', 1),
  ('Beauty & Personal Care', 'Skincare, hair, makeup and fragrances', 'Shop beauty', '/category/beauty-personal-care', 2),
  ('Home & Kitchen', 'Everything to make your home yours', 'Shop home', '/category/home-kitchen', 3)
) v(title, subtitle, button_text, button_link, sort_order)
where not exists (select 1 from public.banners);

-- Example delivery fees only. The owner changes these from the admin dashboard.
insert into public.delivery_zones (county, fee, eta, sort_order)
select * from (values
  ('Nairobi', 200, '1-2 days', 1),
  ('Mombasa', 400, '2-4 days', 2),
  ('Kisumu',  350, '2-4 days', 3),
  ('Nakuru',  300, '2-3 days', 4)
) v(county, fee, eta, sort_order)
where not exists (select 1 from public.delivery_zones);

-- =====================================================================
-- AFTER you register on the website, make yourself the admin:
--   update public.profiles set role = 'admin' where email = 'YOUR-EMAIL@example.com';
-- =====================================================================
