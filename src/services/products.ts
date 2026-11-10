import { supabase } from './supabase';
import type { Product } from '../types';

function mapProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    price: Number(row.price),
    compareAtPrice: row.compare_at_price != null ? Number(row.compare_at_price) : null,
    currency: row.currency ?? 'INR',
    imageUrl: row.image_url ?? '',
    images: row.images ?? [],
    specifications: Array.isArray(row.specifications) ? row.specifications : [],
    sizes: row.sizes ?? [],
    colors: row.colors ?? [],
    category: row.category_id ?? '',
    categoryId: row.category_id ?? null,
    stock: row.stock ?? 0,
    brand: row.brand ?? null,
    salesCount: row.sales_count ?? 0,
    rating: Number(row.rating ?? 0),
    reviewCount: row.review_count ?? 0,
    isTrending: !!row.is_trending,
    isBestSeller: !!row.is_best_seller,
    isNewArrival: !!row.is_new_arrival,
    createdAt: row.created_at,
  };
}


export async function fetchBanners() {
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    imageUrl: row.image_url,
    link: row.link,
    sortOrder: row.sort_order ?? 0,
  }));
}

export async function fetchCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    imageUrl: row.image_url ?? undefined,
    parentId: row.parent_id ?? null,
    icon: row.icon ?? null,
  }));
}

export async function fetchProducts(options: { trending?: boolean; bestSeller?: boolean; newArrival?: boolean; discounted?: boolean; recommended?: boolean; limit?: number } = {}) {
  let query = supabase.from('products').select('*');
  if (options.trending) query = query.eq('is_trending', true);
  if (options.bestSeller) query = query.eq('is_best_seller', true);
  if (options.newArrival) query = query.eq('is_new_arrival', true);
  if (options.discounted) query = query.not('compare_at_price', 'is', null);
  if (options.limit) query = query.limit(options.limit);
  if (options.recommended) query = query.order('rating', { ascending: false });
  else query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  let products = (data ?? []).map(mapProduct);
  if (options.discounted) {
    products = products.filter((p) => (p.compareAtPrice ?? 0) > p.price);
  }
  return products;
}

export async function fetchProductById(id: string) {
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
  if (error) throw error;
  return mapProduct(data);
}

export async function fetchProductsByCategory(categoryId: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category_id', categoryId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapProduct);
}

export async function fetchWishlistIds(userId: string) {
  const { data, error } = await supabase
    .from('wishlists')
    .select('product_id')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((r: any) => r.product_id as string);
}

export async function addToWishlist(userId: string, productId: string) {
  const { error } = await supabase.from('wishlists').insert({ user_id: userId, product_id: productId });
  if (error && error.code !== '23505') throw error;
}

export async function removeFromWishlist(userId: string, productId: string) {
  const { error } = await supabase.from('wishlists').delete().eq('user_id', userId).eq('product_id', productId);
  if (error) throw error;
}

export async function recordRecentlyViewed(userId: string, productId: string) {
  await supabase.from('recently_viewed').insert({ user_id: userId, product_id: productId });
}

export async function fetchRecentlyViewed(userId: string, limit = 10) {
  const { data, error } = await supabase
    .from('recently_viewed')
    .select('product_id, products(*)')
    .eq('user_id', userId)
    .order('viewed_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  const rows = (data ?? []) as any[];
  const seen = new Set<string>();
  const products: ReturnType<typeof mapProduct>[] = [];
  for (const row of rows) {
    const p = row.products;
    if (p && !seen.has(p.id)) {
      seen.add(p.id);
      products.push(mapProduct(p));
    }
  }
  return products;
}

export async function fetchUnreadNotificationCount(userId: string) {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (error) return 0;
  return count ?? 0;
}
export async function fetchProductsByIds(ids: string[]) {
  if (!ids.length) return [];
  const { data, error } = await supabase.from('products').select('*').in('id', ids);
  if (error) throw error;
  return (data ?? []).map(mapProduct);
}
export async function fetchNotifications(userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    isRead: row.is_read,
    createdAt: row.created_at,
  }));
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  if (error) throw error;
}
export type ProductListingParams = {
  categoryIds?: string[];
  brand?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  minRating?: number | null;
  inStock?: boolean;
  discounted?: boolean;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'popular' | 'rating';
  page?: number;
  pageSize?: number;
};

export async function fetchProductsListing(params: ProductListingParams = {}) {
  const {
    categoryIds,
    brand,
    minPrice,
    maxPrice,
    minRating,
    inStock,
    discounted,
    sortBy = 'newest',
    page = 0,
    pageSize = 20,
  } = params;

  let query = supabase.from('products').select('*', { count: 'exact' });

  if (categoryIds && categoryIds.length) {
    query = query.in('category_id', categoryIds);
  }
  if (brand) query = query.eq('brand', brand);
  if (minPrice != null) query = query.gte('price', minPrice);
  if (maxPrice != null) query = query.lte('price', maxPrice);
  if (minRating != null) query = query.gte('rating', minRating);
  if (inStock) query = query.gt('stock', 0);
  if (discounted) query = query.eq('has_discount', true);

  switch (sortBy) {
    case 'price_asc':
      query = query.order('price', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price', { ascending: false });
      break;
    case 'popular':
      query = query.order('sales_count', { ascending: false });
      break;
    case 'rating':
      query = query.order('rating', { ascending: false });
      break;
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false });
      break;
  }

  const from = page * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;
  return {
    products: (data ?? []).map(mapProduct),
    count: count ?? 0,
    page,
    pageSize,
  };
}

export async function fetchBrands() {
  const { data, error } = await supabase
    .from('products')
    .select('brand')
    .not('brand', 'is', null);
  if (error) throw error;
  const set = new Set<string>();
  (data ?? []).forEach((row: any) => {
    if (row.brand) set.add(row.brand);
  });
  return Array.from(set).sort();
}
export async function fetchProductReviews(productId: string) {
  const { data, error } = await supabase
    .from('product_reviews')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    productId: row.product_id,
    userId: row.user_id,
    rating: row.rating,
    title: row.title,
    comment: row.comment,
    createdAt: row.created_at,
    userName: null,
  }));
}

export async function addProductReview(productId: string, userId: string, rating: number, title?: string, comment?: string) {
  const { error } = await supabase.from('product_reviews').insert({
    product_id: productId,
    user_id: userId,
    rating,
    title: title ?? null,
    comment: comment ?? null,
  });
  if (error) throw error;
}

export async function fetchRelatedProducts(productId: string, categoryId: string | null, limit = 8) {
  let query = supabase.from('products').select('*').neq('id', productId).limit(limit);
  if (categoryId) query = query.eq('category_id', categoryId);
  const { data, error } = await query.order('rating', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapProduct);
}

export async function checkDeliveryZone(pinCode: string) {
  const { data, error } = await supabase
    .from('delivery_zones')
    .select('*')
    .eq('pin_code', pinCode)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    pinCode: data.pin_code,
    city: data.city,
    state: data.state,
    estimatedDays: data.estimated_days,
    serviceable: data.serviceable,
  };
}
