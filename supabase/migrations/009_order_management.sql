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
