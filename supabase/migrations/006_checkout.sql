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
