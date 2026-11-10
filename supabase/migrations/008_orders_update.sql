-- Allow users to update their own orders (payment metadata/status)
create policy "users update their orders"
  on public.orders for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
