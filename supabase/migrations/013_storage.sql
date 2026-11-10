-- Storage bucket for product images
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "product images public read"
  on storage.objects for select using (bucket_id = 'product-images');

create policy "admins upload product images"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

create policy "admins update product images"
  on storage.objects for update
  using (bucket_id = 'product-images' and exists (select 1 from public.admin_users a where a.user_id = auth.uid()));
