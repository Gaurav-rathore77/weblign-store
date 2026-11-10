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
