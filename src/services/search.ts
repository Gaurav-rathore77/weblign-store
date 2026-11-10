import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import type { Product } from '../types';

const GUEST_HISTORY_KEY = 'weblign_search_history_guest';

export type SearchSuggestion = {
  type: 'product' | 'brand' | 'category';
  text: string;
};

export type SearchParams = {
  query?: string;
  brand?: string | null;
  categoryId?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  minRating?: number | null;
  inStock?: boolean;
  discounted?: boolean;
  sortBy?: 'relevance' | 'newest' | 'price_asc' | 'price_desc' | 'rating';
  page?: number;
  pageSize?: number;
};

function sanitize(q: string): string {
  return q.replace(/[,%()]/g, ' ').trim();
}

export async function searchProducts(params: SearchParams = {}) {
  const {
    query,
    brand,
    categoryId,
    minPrice,
    maxPrice,
    minRating,
    inStock,
    discounted,
    sortBy = 'relevance',
    page = 0,
    pageSize = 20,
  } = params;

  const q = query?.trim();
  let categoryIds: string[] = [];
  if (q) {
    const { data: cats } = await supabase
      .from('categories')
      .select('id')
      .ilike('name', `%${sanitize(q)}%`);
    categoryIds = (cats ?? []).map((c: any) => c.id);
  }

  let dbQuery = supabase.from('products').select('*', { count: 'exact' });

  if (q) {
    const filters: string[] = [
      `name.ilike.%${sanitize(q)}%`,
      `brand.ilike.%${sanitize(q)}%`,
    ];
    if (categoryIds.length) {
      filters.push(`category_id.in.(${categoryIds.join(',')})`);
    }
    dbQuery = dbQuery.or(filters.join(','));
  }

  if (categoryId) dbQuery = dbQuery.eq('category_id', categoryId);
  if (brand) dbQuery = dbQuery.eq('brand', brand);
  if (minPrice != null) dbQuery = dbQuery.gte('price', minPrice);
  if (maxPrice != null) dbQuery = dbQuery.lte('price', maxPrice);
  if (minRating != null) dbQuery = dbQuery.gte('rating', minRating);
  if (inStock) dbQuery = dbQuery.gt('stock', 0);
  if (discounted) dbQuery = dbQuery.eq('has_discount', true);

  switch (sortBy) {
    case 'price_asc':
      dbQuery = dbQuery.order('price', { ascending: true });
      break;
    case 'price_desc':
      dbQuery = dbQuery.order('price', { ascending: false });
      break;
    case 'rating':
      dbQuery = dbQuery.order('rating', { ascending: false });
      break;
    case 'newest':
      dbQuery = dbQuery.order('created_at', { ascending: false });
      break;
    case 'relevance':
    default:
      dbQuery = dbQuery.order('rating', { ascending: false }).order('review_count', { ascending: false });
      break;
  }

  const from = page * pageSize;
  const to = from + pageSize - 1;
  dbQuery = dbQuery.range(from, to);

  const { data, error, count } = await dbQuery;
  if (error) throw error;

  // map via products service mapProduct (re-implement minimal)
  const products = (data ?? []).map((row: any) => ({
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
  })) as Product[];

  return { products, count: count ?? 0, page, pageSize };
}

export async function fetchSearchSuggestions(q: string): Promise<SearchSuggestion[]> {
  const term = q.trim();
  if (!term) return [];
  const safe = sanitize(term);
  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase.from('products').select('name, brand').or(`name.ilike.%${safe}%,brand.ilike.%${safe}%`).limit(8),
    supabase.from('categories').select('name').ilike('name', `%${safe}%`).limit(5),
  ]);

  const seen = new Set<string>();
  const suggestions: SearchSuggestion[] = [];

  (categories ?? []).forEach((c: any) => {
    if (c.name && !seen.has(c.name)) {
      seen.add(c.name);
      suggestions.push({ type: 'category', text: c.name });
    }
  });
  (products ?? []).forEach((p: any) => {
    if (p.name && !seen.has(p.name)) {
      seen.add(p.name);
      suggestions.push({ type: 'product', text: p.name });
    }
    if (p.brand && !seen.has(p.brand)) {
      seen.add(p.brand);
      suggestions.push({ type: 'brand', text: p.brand });
    }
  });

  return suggestions.slice(0, 10);
}

export async function fetchRecentSearches(userId?: string | null): Promise<string[]> {
  if (userId) {
    const { data, error } = await supabase
      .from('search_history')
      .select('query')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) return [];
    const seen = new Set<string>();
    const result: string[] = [];
    (data ?? []).forEach((row: any) => {
      if (row.query && !seen.has(row.query)) {
        seen.add(row.query);
        result.push(row.query);
      }
    });
    return result.slice(0, 10);
  }
  try {
    const raw = await AsyncStorage.getItem(GUEST_HISTORY_KEY);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return arr.slice(0, 10);
  } catch {
    return [];
  }
}

export async function saveRecentSearch(query: string, userId?: string | null): Promise<void> {
  const q = query.trim();
  if (!q) return;

  if (userId) {
    await supabase.from('search_history').delete().eq('user_id', userId).eq('query', q);
    await supabase.from('search_history').insert({ user_id: userId, query: q });
  } else {
    try {
      const raw = await AsyncStorage.getItem(GUEST_HISTORY_KEY);
      const arr: string[] = raw ? JSON.parse(raw) : [];
      const next = [q, ...arr.filter((x) => x !== q)].slice(0, 10);
      await AsyncStorage.setItem(GUEST_HISTORY_KEY, JSON.stringify(next));
    } catch {}
  }

  try {
    await supabase.rpc('increment_popular_search', { q });
  } catch {}
}

export async function clearRecentSearches(userId?: string | null): Promise<void> {
  if (userId) {
    await supabase.from('search_history').delete().eq('user_id', userId);
  } else {
    await AsyncStorage.removeItem(GUEST_HISTORY_KEY);
  }
}

export async function fetchPopularSearches(): Promise<string[]> {
  const { data, error } = await supabase
    .from('popular_searches')
    .select('query')
    .order('search_count', { ascending: false })
    .limit(10);
  if (!error && data && data.length) {
    return data.map((r: any) => r.query);
  }

  // Fallback: derive from categories, brands, top products
  const [{ data: cats }, { data: prods }] = await Promise.all([
    supabase.from('categories').select('name').limit(6),
    supabase.from('products').select('name, brand').order('rating', { ascending: false }).limit(6),
  ]);
  const set = new Set<string>();
  const result: string[] = [];
  (cats ?? []).forEach((c: any) => {
    if (c.name && !set.has(c.name)) { set.add(c.name); result.push(c.name); }
  });
  (prods ?? []).forEach((p: any) => {
    if (p.brand && !set.has(p.brand)) { set.add(p.brand); result.push(p.brand); }
    if (p.name && !set.has(p.name) && result.length < 10) { set.add(p.name); result.push(p.name); }
  });
  return result.slice(0, 10);
}
