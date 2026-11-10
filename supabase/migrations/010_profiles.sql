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
