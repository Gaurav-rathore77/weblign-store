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
