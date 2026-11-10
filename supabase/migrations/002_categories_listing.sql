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
