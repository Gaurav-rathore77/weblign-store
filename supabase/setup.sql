
-- ===== 001_initial_schema.sql =====
-- Weblign Store initial schema
-- Run this in your Supabase SQL editor.

create extension if not exists "uuid-ossp";

create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  image_url text,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  price numeric(10,2) not null,
  compare_at_price numeric(10,2),
  currency text not null default 'INR',
  image_url text,
  images text[] default '{}',
  category_id uuid references public.categories(id) on delete set null,
  stock int not null default 0,
  rating numeric(3,2) default 0,
  review_count int default 0,
  is_trending boolean default false,
  is_best_seller boolean default false,
  is_new_arrival boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.banners (
  id uuid primary key default uuid_generate_v4(),
  title text,
  subtitle text,
  image_url text,
  link text,
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.wishlists (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz default now(),
  unique (user_id, product_id)
);

create table if not exists public.recently_viewed (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  viewed_at timestamptz default now()
);

create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- RLS
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.banners enable row level security;
alter table public.wishlists enable row level security;
alter table public.recently_viewed enable row level security;
alter table public.notifications enable row level security;

create policy "categories are viewable by everyone"
  on public.categories for select using (true);

create policy "products are viewable by everyone"
  on public.products for select using (true);

create policy "banners are viewable by everyone"
  on public.banners for select using (is_active = true);

create policy "users manage their wishlist"
  on public.wishlists for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage their recently viewed"
  on public.recently_viewed for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users view their notifications"
  on public.notifications for select using (auth.uid() = user_id);

create policy "users update their notifications"
  on public.notifications for update using (auth.uid() = user_id);


-- ===== 002_categories_listing.sql =====
-- Weblign Store categories & listing enhancements

alter table public.categories
  add column if not exists parent_id uuid references public.categories(id) on delete set null,
  add column if not exists icon text;

alter table public.products
  add column if not exists brand text,
  add column if not exists sales_count int not null default 0,
  add column if not exists has_discount boolean generated always as (compare_at_price is not null and compare_at_price > price) stored;

create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_brand on public.products(brand);
create index if not exists idx_products_price on public.products(price);
create index if not exists idx_categories_parent on public.categories(parent_id);


-- ===== 003_product_details.sql =====
-- Weblign Store product details enhancements

alter table public.products
  add column if not exists specifications jsonb default '[]'::jsonb,
  add column if not exists sizes text[] default '{}',
  add column if not exists colors text[] default '{}';

create table if not exists public.product_reviews (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  title text,
  comment text,
  created_at timestamptz default now()
);

create table if not exists public.delivery_zones (
  id uuid primary key default uuid_generate_v4(),
  pin_code text not null unique,
  city text,
  state text,
  estimated_days int not null default 4,
  serviceable boolean default true
);

alter table public.product_reviews enable row level security;
alter table public.delivery_zones enable row level security;

create policy "reviews are viewable by everyone"
  on public.product_reviews for select using (true);

create policy "users can create reviews"
  on public.product_reviews for insert with check (auth.uid() = user_id);

create policy "delivery zones viewable by everyone"
  on public.delivery_zones for select using (true);


-- ===== 004_search.sql =====
-- Weblign Store search enhancements

create table if not exists public.search_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  query text not null,
  created_at timestamptz default now()
);

create table if not exists public.popular_searches (
  query text primary key,
  search_count int not null default 1,
  updated_at timestamptz default now()
);

create index if not exists idx_search_history_user on public.search_history(user_id);
create index if not exists idx_search_history_query on public.search_history(query);

alter table public.search_history enable row level security;
alter table public.popular_searches enable row level security;

create policy "users manage their search history"
  on public.search_history for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "popular searches viewable by everyone"
  on public.popular_searches for select using (true);

create or replace function public.increment_popular_search(q text)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.popular_searches (query, search_count)
  values (q, 1)
  on conflict (query) do update
  set search_count = public.popular_searches.search_count + 1,
      updated_at = now();
end;
$$;


-- ===== 005_cart.sql =====
-- Weblign Store cart & coupons

create table if not exists public.carts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.cart_items (
  id uuid primary key default uuid_generate_v4(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity int not null default 1,
  size text,
  color text,
  created_at timestamptz default now(),
  unique (cart_id, product_id, size, color)
);

create table if not exists public.coupons (
  code text primary key,
  discount_type text not null check (discount_type in ('percent','fixed')),
  discount_value numeric not null,
  min_order numeric default 0,
  active boolean default true,
  expires_at timestamptz
);

alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.coupons enable row level security;

create policy "users manage their cart"
  on public.carts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage their cart items"
  on public.cart_items for all
  using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()));

create policy "coupons viewable by everyone"
  on public.coupons for select using (active = true);


-- ===== 006_checkout.sql =====
-- Weblign Store addresses and orders

create table if not exists public.addresses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null,
  line1 text not null,
  line2 text,
  area text,
  landmark text,
  city text not null,
  state text not null,
  postal_code text not null,
  country text not null default 'India',
  address_type text not null default 'home' check (address_type in ('home','work')),
  is_default boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  address_id uuid references public.addresses(id) on delete set null,
  subtotal numeric not null,
  discount numeric not null default 0,
  delivery_charge numeric not null default 0,
  total numeric not null,
  coupon_code text,
  status text not null default 'pending',
  payment_status text not null default 'pending',
  created_at timestamptz default now()
);

create table if not exists public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  product_image text,
  price numeric not null,
  quantity int not null,
  size text,
  color text
);

alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "users manage their addresses"
  on public.addresses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users view their orders"
  on public.orders for select using (auth.uid() = user_id);

create policy "users create their orders"
  on public.orders for insert with check (auth.uid() = user_id);

create policy "users view their order items"
  on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

create policy "users create their order items"
  on public.order_items for insert
  with check (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));


-- ===== 007_payments.sql =====
-- Weblign Store payment enhancements

alter table public.orders
  add column if not exists razorpay_order_id text,
  add column if not exists razorpay_payment_id text,
  add column if not exists razorpay_signature text;

create unique index if not exists idx_orders_razorpay_order_id on public.orders(razorpay_order_id);


-- ===== 008_orders_update.sql =====
-- Allow users to update their own orders (payment metadata/status)
create policy "users update their orders"
  on public.orders for update using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ===== 009_order_management.sql =====
-- Weblign Store order management enhancements

alter table public.orders
  add column if not exists tracking_number text,
  add column if not exists carrier text,
  add column if not exists estimated_delivery timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists return_requested_at timestamptz,
  add column if not exists returned_at timestamptz,
  add column if not exists refund_status text default 'none',
  add column if not exists refund_amount numeric default 0;

create table if not exists public.return_requests (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  status text not null default 'requested',
  created_at timestamptz default now()
);

alter table public.return_requests enable row level security;

create policy "users manage their return requests"
  on public.return_requests for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ===== 010_profiles.sql =====
-- Weblign Store profiles

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  notification_orders boolean default true,
  notification_offers boolean default true,
  notification_push boolean default true,
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles viewable by owner"
  on public.profiles for select using (auth.uid() = id);

create policy "profiles updatable by owner"
  on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "profiles insertable by owner"
  on public.profiles for insert with check (auth.uid() = id);

-- Storage bucket for avatars (create via dashboard or SQL)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars public read"
  on storage.objects for select using (bucket_id = 'avatars');

create policy "users upload their avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "users update their avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);


-- ===== 011_notifications.sql =====
-- Weblign Store notifications & promotions

create table if not exists public.push_tokens (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  platform text,
  created_at timestamptz default now(),
  unique (user_id, token)
);

create table if not exists public.promotions (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  body text,
  image_url text,
  link text,
  active boolean default true,
  starts_at timestamptz default now(),
  ends_at timestamptz,
  created_at timestamptz default now()
);

alter table public.push_tokens enable row level security;
alter table public.promotions enable row level security;

create policy "users manage their push tokens"
  on public.push_tokens for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "promotions viewable by everyone"
  on public.promotions for select using (active = true);

-- Add type/data columns to notifications if missing
alter table public.notifications
  add column if not exists type text default 'general',
  add column if not exists data jsonb default '{}'::jsonb;


-- ===== 012_admin.sql =====
-- Weblign Store admin

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin',
  created_at timestamptz default now()
);

alter table public.admin_users enable row level security;

create policy "admins can view admin_users"
  on public.admin_users for select using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

-- Admin RLS policies for products, categories, banners, coupons, orders, profiles, promotions, notifications
create policy "admins manage products" on public.products for all
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

create policy "admins manage categories" on public.categories for all
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

create policy "admins manage banners" on public.banners for all
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

create policy "admins manage coupons" on public.coupons for all
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

create policy "admins manage orders" on public.orders for all
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

create policy "admins manage promotions" on public.promotions for all
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

create policy "admins view profiles" on public.profiles for select
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

create policy "admins view addresses" on public.addresses for select
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));


-- ===== 013_storage.sql =====
-- Storage bucket for product images
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "product images public read"
  on storage.objects for select using (bucket_id = 'product-images');

create policy "admins upload product images"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

create policy "admins update product images"
  on storage.objects for update
  using (bucket_id = 'product-images' and exists (select 1 from public.admin_users a where a.user_id = auth.uid()));


-- ===== seed.sql =====
-- Weblign Store seed data
-- Run after migrations in Supabase SQL editor.

-- Categories
insert into public.categories (name, slug, image_url, sort_order) values
  ('Electronics', 'electronics', 'https://picsum.photos/seed/cat-electronics/200/200', 1),
  ('Fashion', 'fashion', 'https://picsum.photos/seed/cat-fashion/200/200', 2),
  ('Home & Kitchen', 'home-kitchen', 'https://picsum.photos/seed/cat-home/200/200', 3),
  ('Beauty', 'beauty', 'https://picsum.photos/seed/cat-beauty/200/200', 4),
  ('Sports', 'sports', 'https://picsum.photos/seed/cat-sports/200/200', 5)
on conflict (slug) do nothing;

-- Subcategories for Electronics
insert into public.categories (name, slug, parent_id, image_url, sort_order)
select 'Mobiles', 'mobiles', c.id, 'https://picsum.photos/seed/cat-mobiles/200/200', 1 from public.categories c where c.slug='electronics'
on conflict (slug) do nothing;
insert into public.categories (name, slug, parent_id, image_url, sort_order)
select 'Laptops', 'laptops', c.id, 'https://picsum.photos/seed/cat-laptops/200/200', 2 from public.categories c where c.slug='electronics'
on conflict (slug) do nothing;
insert into public.categories (name, slug, parent_id, image_url, sort_order)
select 'Audio', 'audio', c.id, 'https://picsum.photos/seed/cat-audio/200/200', 3 from public.categories c where c.slug='electronics'
on conflict (slug) do nothing;

-- Products
insert into public.products (name, description, price, compare_at_price, currency, image_url, images, category_id, stock, brand, rating, review_count, is_trending, is_best_seller, is_new_arrival, sizes, colors, specifications) values
  ('Wireless Bluetooth Headphones', 'Premium sound with active noise cancellation and 30-hour battery life.', 2999, 4999, 'INR', 'https://picsum.photos/seed/prod-headphones/600/600', array['https://picsum.photos/seed/prod-headphones/600/600','https://picsum.photos/seed/prod-headphones2/600/600'], (select id from public.categories where slug='audio'), 50, 'SoundMax', 4.5, 120, true, true, false, array['S','M','L'], array['Black','White','Blue'], '[{"label":"Battery","value":"30 hours"},{"label":"Bluetooth","value":"5.3"}]'::jsonb),
  ('Smartphone 5G', 'Latest 5G smartphone with 108MP camera and 120Hz display.', 18999, 24999, 'INR', 'https://picsum.photos/seed/prod-phone/600/600', array['https://picsum.photos/seed/prod-phone/600/600'], (select id from public.categories where slug='mobiles'), 30, 'TechNova', 4.7, 340, true, true, true, array[]::text[], array['Black','Silver'], '[{"label":"RAM","value":"8GB"},{"label":"Storage","value":"128GB"}]'::jsonb),
  ('Ultrabook Laptop', 'Lightweight laptop with 16GB RAM and 512GB SSD.', 54999, 69999, 'INR', 'https://picsum.photos/seed/prod-laptop/600/600', array['https://picsum.photos/seed/prod-laptop/600/600'], (select id from public.categories where slug='laptops'), 15, 'CompAir', 4.6, 89, false, true, true, array[]::text[], array['Gray','Silver'], '[{"label":"RAM","value":"16GB"},{"label":"SSD","value":"512GB"}]'::jsonb),
  ('Men Cotton T-Shirt', 'Comfortable 100% cotton t-shirt for everyday wear.', 499, 999, 'INR', 'https://picsum.photos/seed/prod-tshirt/600/600', array['https://picsum.photos/seed/prod-tshirt/600/600'], (select id from public.categories where slug='fashion'), 200, 'StyleHub', 4.2, 560, true, false, true, array['S','M','L','XL'], array['Red','Blue','Black','White'], '[{"label":"Fabric","value":"100% Cotton"}]'::jsonb),
  ('Women Kurta', 'Elegant printed kurta for festive occasions.', 1299, 2499, 'INR', 'https://picsum.photos/seed/prod-kurta/600/600', array['https://picsum.photos/seed/prod-kurta/600/600'], (select id from public.categories where slug='fashion'), 80, 'EthnicWear', 4.4, 210, false, true, false, array['S','M','L'], array['Pink','Green','Yellow'], '[{"label":"Fabric","value":"Rayon"}]'::jsonb),
  ('Non-stick Cookware Set', '5-piece non-stick cookware set for healthy cooking.', 1999, 3499, 'INR', 'https://picsum.photos/seed/prod-cookware/600/600', array['https://picsum.photos/seed/prod-cookware/600/600'], (select id from public.categories where slug='home-kitchen'), 60, 'HomeChef', 4.3, 150, true, false, false, array[]::text[], array['Black','Red'], '[{"label":"Pieces","value":"5"}]'::jsonb),
  ('Vitamin C Face Serum', 'Brightening serum with 20% vitamin C.', 699, 1299, 'INR', 'https://picsum.photos/seed/prod-serum/600/600', array['https://picsum.photos/seed/prod-serum/600/600'], (select id from public.categories where slug='beauty'), 120, 'GlowSkin', 4.6, 430, true, true, true, array[]::text[], array[]::text[], '[{"label":"Volume","value":"30ml"}]'::jsonb),
  ('Yoga Mat Premium', 'Anti-slip yoga mat with carrying strap.', 899, 1599, 'INR', 'https://picsum.photos/seed/prod-yoga/600/600', array['https://picsum.photos/seed/prod-yoga/600/600'], (select id from public.categories where slug='sports'), 90, 'FitLife', 4.1, 95, false, false, true, array[]::text[], array['Purple','Blue','Green'], '[{"label":"Thickness","value":"6mm"}]'::jsonb),
  ('Smart Watch', 'Fitness tracking smartwatch with heart rate monitor.', 3499, 5999, 'INR', 'https://picsum.photos/seed/prod-watch/600/600', array['https://picsum.photos/seed/prod-watch/600/600'], (select id from public.categories where slug='electronics'), 40, 'TechNova', 4.5, 280, true, true, false, array[]::text[], array['Black','Silver'], '[{"label":"Battery","value":"7 days"}]'::jsonb),
  ('Running Shoes', 'Lightweight running shoes with cushioned sole.', 2499, 3999, 'INR', 'https://picsum.photos/seed/prod-shoes/600/600', array['https://picsum.photos/seed/prod-shoes/600/600'], (select id from public.categories where slug='sports'), 70, 'RunFast', 4.4, 175, true, false, true, array['7','8','9','10'], array['Black','White','Red'], '[{"label":"Sole","value":"EVA"}]'::jsonb)
on conflict do nothing;

-- Banners
insert into public.banners (title, subtitle, image_url, sort_order, is_active) values
  ('Mega Sale', 'Up to 50% off on electronics', 'https://picsum.photos/seed/banner1/800/300', 1, true),
  ('New Arrivals', 'Fresh fashion collection', 'https://picsum.photos/seed/banner2/800/300', 2, true)
on conflict do nothing;

-- Coupons
insert into public.coupons (code, discount_type, discount_value, min_order, active) values
  ('WELCOME10', 'percent', 10, 500, true),
  ('FLAT200', 'fixed', 200, 1000, true)
on conflict (code) do nothing;

-- Promotions
insert into public.promotions (title, body, image_url, active) values
  ('Festive Sale', 'Celebrate with up to 60% off across categories.', 'https://picsum.photos/seed/promo1/800/300', true),
  ('New Launches', 'Check out the newest arrivals today.', 'https://picsum.photos/seed/promo2/800/300', true)
on conflict do nothing;

-- Delivery zones
insert into public.delivery_zones (pin_code, city, state, estimated_days, serviceable) values
  ('400001', 'Mumbai', 'Maharashtra', 3, true),
  ('110001', 'New Delhi', 'Delhi', 4, true),
  ('560001', 'Bengaluru', 'Karnataka', 4, true),
  ('600001', 'Chennai', 'Tamil Nadu', 5, true)
on conflict (pin_code) do nothing;

