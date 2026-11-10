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
