-- Weblign Store seed data
-- Run after migrations in Supabase SQL editor.

-- Categories
insert into public.categories (name, slug, image_url, sort_order) values
  ('Electronics', 'electronics', 'https://picsum.photos/seed/cat-electronics/200/200', 1),
  ('Fashion', 'fashion', 'https://picsum.photos/seed/cat-fashion/200/200', 2),
  ('Home & Kitchen', 'home-kitchen', 'https://picsum.photos/seed/cat-home/200/200', 3),
  ('Beauty', 'beauty', 'https://picsum.photos/seed/cat-beauty/200/200', 4),
  ('Sports', 'sports', 'https://picsum.photos/seed/cat-sports/200/200', 5)
on conflict (slug) do nothing;

-- Subcategories for Electronics
insert into public.categories (name, slug, parent_id, image_url, sort_order)
select 'Mobiles', 'mobiles', c.id, 'https://picsum.photos/seed/cat-mobiles/200/200', 1 from public.categories c where c.slug='electronics'
on conflict (slug) do nothing;
insert into public.categories (name, slug, parent_id, image_url, sort_order)
select 'Laptops', 'laptops', c.id, 'https://picsum.photos/seed/cat-laptops/200/200', 2 from public.categories c where c.slug='electronics'
on conflict (slug) do nothing;
insert into public.categories (name, slug, parent_id, image_url, sort_order)
select 'Audio', 'audio', c.id, 'https://picsum.photos/seed/cat-audio/200/200', 3 from public.categories c where c.slug='electronics'
on conflict (slug) do nothing;

-- Products
insert into public.products (name, description, price, compare_at_price, currency, image_url, images, category_id, stock, brand, rating, review_count, is_trending, is_best_seller, is_new_arrival, sizes, colors, specifications) values
  ('Wireless Bluetooth Headphones', 'Premium sound with active noise cancellation and 30-hour battery life.', 2999, 4999, 'INR', 'https://picsum.photos/seed/prod-headphones/600/600', array['https://picsum.photos/seed/prod-headphones/600/600','https://picsum.photos/seed/prod-headphones2/600/600'], (select id from public.categories where slug='audio'), 50, 'SoundMax', 4.5, 120, true, true, false, array['S','M','L'], array['Black','White','Blue'], '[{"label":"Battery","value":"30 hours"},{"label":"Bluetooth","value":"5.3"}]'::jsonb),
  ('Smartphone 5G', 'Latest 5G smartphone with 108MP camera and 120Hz display.', 18999, 24999, 'INR', 'https://picsum.photos/seed/prod-phone/600/600', array['https://picsum.photos/seed/prod-phone/600/600'], (select id from public.categories where slug='mobiles'), 30, 'TechNova', 4.7, 340, true, true, true, array[]::text[], array['Black','Silver'], '[{"label":"RAM","value":"8GB"},{"label":"Storage","value":"128GB"}]'::jsonb),
  ('Ultrabook Laptop', 'Lightweight laptop with 16GB RAM and 512GB SSD.', 54999, 69999, 'INR', 'https://picsum.photos/seed/prod-laptop/600/600', array['https://picsum.photos/seed/prod-laptop/600/600'], (select id from public.categories where slug='laptops'), 15, 'CompAir', 4.6, 89, false, true, true, array[]::text[], array['Gray','Silver'], '[{"label":"RAM","value":"16GB"},{"label":"SSD","value":"512GB"}]'::jsonb),
  ('Men Cotton T-Shirt', 'Comfortable 100% cotton t-shirt for everyday wear.', 499, 999, 'INR', 'https://picsum.photos/seed/prod-tshirt/600/600', array['https://picsum.photos/seed/prod-tshirt/600/600'], (select id from public.categories where slug='fashion'), 200, 'StyleHub', 4.2, 560, true, false, true, array['S','M','L','XL'], array['Red','Blue','Black','White'], '[{"label":"Fabric","value":"100% Cotton"}]'::jsonb),
  ('Women Kurta', 'Elegant printed kurta for festive occasions.', 1299, 2499, 'INR', 'https://picsum.photos/seed/prod-kurta/600/600', array['https://picsum.photos/seed/prod-kurta/600/600'], (select id from public.categories where slug='fashion'), 80, 'EthnicWear', 4.4, 210, false, true, false, array['S','M','L'], array['Pink','Green','Yellow'], '[{"label":"Fabric","value":"Rayon"}]'::jsonb),
  ('Non-stick Cookware Set', '5-piece non-stick cookware set for healthy cooking.', 1999, 3499, 'INR', 'https://picsum.photos/seed/prod-cookware/600/600', array['https://picsum.photos/seed/prod-cookware/600/600'], (select id from public.categories where slug='home-kitchen'), 60, 'HomeChef', 4.3, 150, true, false, false, array[]::text[], array['Black','Red'], '[{"label":"Pieces","value":"5"}]'::jsonb),
  ('Vitamin C Face Serum', 'Brightening serum with 20% vitamin C.', 699, 1299, 'INR', 'https://picsum.photos/seed/prod-serum/600/600', array['https://picsum.photos/seed/prod-serum/600/600'], (select id from public.categories where slug='beauty'), 120, 'GlowSkin', 4.6, 430, true, true, true, array[]::text[], array[]::text[], '[{"label":"Volume","value":"30ml"}]'::jsonb),
  ('Yoga Mat Premium', 'Anti-slip yoga mat with carrying strap.', 899, 1599, 'INR', 'https://picsum.photos/seed/prod-yoga/600/600', array['https://picsum.photos/seed/prod-yoga/600/600'], (select id from public.categories where slug='sports'), 90, 'FitLife', 4.1, 95, false, false, true, array[]::text[], array['Purple','Blue','Green'], '[{"label":"Thickness","value":"6mm"}]'::jsonb),
  ('Smart Watch', 'Fitness tracking smartwatch with heart rate monitor.', 3499, 5999, 'INR', 'https://picsum.photos/seed/prod-watch/600/600', array['https://picsum.photos/seed/prod-watch/600/600'], (select id from public.categories where slug='electronics'), 40, 'TechNova', 4.5, 280, true, true, false, array[]::text[], array['Black','Silver'], '[{"label":"Battery","value":"7 days"}]'::jsonb),
  ('Running Shoes', 'Lightweight running shoes with cushioned sole.', 2499, 3999, 'INR', 'https://picsum.photos/seed/prod-shoes/600/600', array['https://picsum.photos/seed/prod-shoes/600/600'], (select id from public.categories where slug='sports'), 70, 'RunFast', 4.4, 175, true, false, true, array['7','8','9','10'], array['Black','White','Red'], '[{"label":"Sole","value":"EVA"}]'::jsonb)
on conflict do nothing;

-- Banners
insert into public.banners (title, subtitle, image_url, sort_order, is_active) values
  ('Mega Sale', 'Up to 50% off on electronics', 'https://picsum.photos/seed/banner1/800/300', 1, true),
  ('New Arrivals', 'Fresh fashion collection', 'https://picsum.photos/seed/banner2/800/300', 2, true)
on conflict do nothing;

-- Coupons
insert into public.coupons (code, discount_type, discount_value, min_order, active) values
  ('WELCOME10', 'percent', 10, 500, true),
  ('FLAT200', 'fixed', 200, 1000, true)
on conflict (code) do nothing;

-- Promotions
insert into public.promotions (title, body, image_url, active) values
  ('Festive Sale', 'Celebrate with up to 60% off across categories.', 'https://picsum.photos/seed/promo1/800/300', true),
  ('New Launches', 'Check out the newest arrivals today.', 'https://picsum.photos/seed/promo2/800/300', true)
on conflict do nothing;

-- Delivery zones
insert into public.delivery_zones (pin_code, city, state, estimated_days, serviceable) values
  ('400001', 'Mumbai', 'Maharashtra', 3, true),
  ('110001', 'New Delhi', 'Delhi', 4, true),
  ('560001', 'Bengaluru', 'Karnataka', 4, true),
  ('600001', 'Chennai', 'Tamil Nadu', 5, true)
on conflict (pin_code) do nothing;
