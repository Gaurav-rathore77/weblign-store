-- Weblign Store payment enhancements

alter table public.orders
  add column if not exists razorpay_order_id text,
  add column if not exists razorpay_payment_id text,
  add column if not exists razorpay_signature text;

create unique index if not exists idx_orders_razorpay_order_id on public.orders(razorpay_order_id);
