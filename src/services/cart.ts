import { supabase } from './supabase';
import { fetchProductsByIds } from './products';
import type { CartItem, Coupon, Product } from '../types';

async function getCartId(userId: string): Promise<string> {
  const { data: existing } = await supabase.from('carts').select('id').eq('user_id', userId).maybeSingle();
  if (existing?.id) return existing.id;
  const { data, error } = await supabase.from('carts').insert({ user_id: userId }).select('id').single();
  if (error) throw error;
  return data.id;
}

export async function fetchCart(userId: string): Promise<CartItem[]> {
  const cartId = await getCartId(userId);
  const { data: items, error } = await supabase
    .from('cart_items')
    .select('*')
    .eq('cart_id', cartId);
  if (error) throw error;
  if (!items?.length) return [];

  const productIds = [...new Set(items.map((i: any) => i.product_id))];
  const products = await fetchProductsByIds(productIds);
  const productMap = new Map(products.map((p) => [p.id, p]));

  return items
    .map((row: any) => {
      const product = productMap.get(row.product_id);
      if (!product) return null;
      return {
        productId: row.product_id,
        product,
        quantity: row.quantity,
        size: row.size,
        color: row.color,
      } as CartItem;
    })
    .filter(Boolean) as CartItem[];
}

export async function upsertCartItem(
  userId: string,
  productId: string,
  quantity: number,
  size: string | null = null,
  color: string | null = null,
): Promise<void> {
  const cartId = await getCartId(userId);
  if (quantity <= 0) {
    await removeCartItem(userId, productId, size, color);
    return;
  }
  const { error } = await supabase.from('cart_items').upsert(
    {
      cart_id: cartId,
      product_id: productId,
      quantity,
      size,
      color,
    },
    { onConflict: 'cart_id,product_id,size,color' },
  );
  if (error) throw error;
}

export async function removeCartItem(
  userId: string,
  productId: string,
  size: string | null = null,
  color: string | null = null,
): Promise<void> {
  const cartId = await getCartId(userId);
  let q = supabase.from('cart_items').delete().eq('cart_id', cartId).eq('product_id', productId);
  if (size) q = q.eq('size', size); else q = q.is('size', null);
  if (color) q = q.eq('color', color); else q = q.is('color', null);
  const { error } = await q;
  if (error) throw error;
}

export async function clearCartRemote(userId: string): Promise<void> {
  const cartId = await getCartId(userId);
  const { error } = await supabase.from('cart_items').delete().eq('cart_id', cartId);
  if (error) throw error;
}

export async function validateCoupon(code: string, subtotal: number): Promise<Coupon | null> {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('active', true)
    .maybeSingle();
  if (error || !data) return null;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null;
  if (subtotal < Number(data.min_order ?? 0)) return null;
  return {
    code: data.code,
    discountType: data.discount_type,
    discountValue: Number(data.discount_value),
    minOrder: Number(data.min_order ?? 0),
    active: data.active,
    expiresAt: data.expires_at,
  };
}
