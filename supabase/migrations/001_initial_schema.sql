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
