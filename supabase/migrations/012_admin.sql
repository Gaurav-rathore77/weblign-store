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
