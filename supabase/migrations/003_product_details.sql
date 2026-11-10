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
