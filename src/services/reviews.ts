import { supabase } from './supabase';

export async function fetchUserReviews(userId: string) {
  const { data, error } = await supabase
    .from('product_reviews')
    .select('*, products(name, image_url)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    productId: row.product_id,
    productName: row.products?.name ?? 'Product',
    productImage: row.products?.image_url ?? null,
    rating: row.rating,
    title: row.title,
    comment: row.comment,
    createdAt: row.created_at,
  }));
}
