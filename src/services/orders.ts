import { supabase } from './supabase';
import type { CartItem, Order, ReturnRequest } from '../types';
import { fetchProductsByIds } from './products';

export type CreateOrderPayload = {
  userId: string;
  addressId: string | null;
  items: CartItem[];
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  total: number;
  couponCode?: string | null;
};

function mapOrder(row: any): Order {
  return {
    id: row.id,
    userId: row.user_id,
    items: [],
    total: Number(row.total),
    currency: 'INR',
    status: row.status,
    paymentStatus: row.payment_status,
    paymentId: row.razorpay_payment_id ?? undefined,
    addressId: row.address_id,
    subtotal: Number(row.subtotal ?? 0),
    discount: Number(row.discount ?? 0),
    deliveryCharge: Number(row.delivery_charge ?? 0),
    couponCode: row.coupon_code,
    trackingNumber: row.tracking_number,
    carrier: row.carrier,
    estimatedDelivery: row.estimated_delivery,
    cancelledAt: row.cancelled_at,
    returnRequestedAt: row.return_requested_at,
    returnedAt: row.returned_at,
    refundStatus: row.refund_status ?? 'none',
    refundAmount: Number(row.refund_amount ?? 0),
    createdAt: row.created_at,
  };
}

export async function createOrder(payload: CreateOrderPayload): Promise<string> {
  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      user_id: payload.userId,
      address_id: payload.addressId,
      subtotal: payload.subtotal,
      discount: payload.discount,
      delivery_charge: payload.deliveryCharge,
      total: payload.total,
      coupon_code: payload.couponCode ?? null,
      status: 'pending',
      payment_status: 'pending',
    })
    .select('id')
    .single();
  if (error) throw error;

  const orderItems = payload.items.map((item) => ({
    order_id: order.id,
    product_id: item.productId,
    product_name: item.product.name,
    product_image: item.product.imageUrl,
    price: item.product.price,
    quantity: item.quantity,
    size: item.size ?? null,
    color: item.color ?? null,
  }));

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
  if (itemsError) throw itemsError;

  return order.id;
}

export async function fetchOrders(userId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapOrder);
}

export async function fetchOrder(orderId: string): Promise<Order | null> {
  const { data, error } = await supabase.from('orders').select('*').eq('id', orderId).single();
  if (error) return null;
  const order = mapOrder(data);

  const { data: items } = await supabase.from('order_items').select('*').eq('order_id', orderId);
  const productIds = [...new Set((items ?? []).map((i: any) => i.product_id).filter(Boolean))];
  const products = await fetchProductsByIds(productIds);
  const productMap = new Map(products.map((p) => [p.id, p]));

  order.items = (items ?? []).map((row: any) => {
    const product = productMap.get(row.product_id) ?? ({
      id: row.product_id ?? '',
      name: row.product_name,
      description: '',
      price: Number(row.price),
      currency: 'INR',
      imageUrl: row.product_image ?? '',
      images: [],
      specifications: [],
      sizes: [],
      colors: [],
      category: '',
      stock: 0,
      rating: 0,
      reviewCount: 0,
      createdAt: row.created_at ?? new Date().toISOString(),
    } as any);
    return {
      productId: row.product_id,
      product,
      quantity: row.quantity,
      size: row.size,
      color: row.color,
    };
  });

  return order;
}

export async function fetchAddressById(addressId: string) {
  const { data, error } = await supabase.from('addresses').select('*').eq('id', addressId).single();
  if (error) return null;
  return data;
}

export async function cancelOrder(orderId: string): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('id', orderId);
  if (error) throw error;
}

export async function requestReturn(orderId: string, userId: string, reason: string): Promise<void> {
  const { error } = await supabase.from('return_requests').insert({
    order_id: orderId,
    user_id: userId,
    reason,
    status: 'requested',
  });
  if (error) throw error;
  await supabase.from('orders').update({ status: 'returned', return_requested_at: new Date().toISOString() }).eq('id', orderId);
}

export async function fetchReturnRequests(orderId: string): Promise<ReturnRequest[]> {
  const { data, error } = await supabase.from('return_requests').select('*').eq('order_id', orderId);
  if (error) return [];
  return (data ?? []).map((row: any) => ({
    id: row.id,
    orderId: row.order_id,
    userId: row.user_id,
    reason: row.reason,
    status: row.status,
    createdAt: row.created_at,
  }));
}

export async function updateOrderRazorpayId(orderId: string, razorpayOrderId: string): Promise<void> {
  const { error } = await supabase.from('orders').update({ razorpay_order_id: razorpayOrderId }).eq('id', orderId);
  if (error) throw error;
}

export async function updateOrderPaymentStatus(orderId: string, status: 'pending' | 'paid' | 'failed' | 'cancelled', paymentId?: string): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ payment_status: status, ...(paymentId ? { razorpay_payment_id: paymentId } : {}) })
    .eq('id', orderId);
  if (error) throw error;
}
