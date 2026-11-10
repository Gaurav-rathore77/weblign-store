import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [address, setAddress] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const { data: o } = await supabase.from('orders').select('*, profiles(full_name,email,phone)').eq('id', id).single();
      setOrder(o);
      if (o?.address_id) {
        const { data: a } = await supabase.from('addresses').select('*').eq('id', o.address_id).single();
        setAddress(a);
      }
      const { data: its } = await supabase.from('order_items').select('*').eq('order_id', id);
      setItems(its ?? []);
    };
    load();
  }, [id]);

  if (!order) return <div>Loading...</div>;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Order {order.id.slice(0, 8)}</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div style={{ background: '#fff', padding: 20, borderRadius: 12 }}>
          <h3>Customer</h3>
          <p>{order.profiles?.full_name}</p>
          <p>{order.profiles?.email}</p>
          <h3>Address</h3>
          {address ? (
            <div>
              <p>{address.full_name}</p>
              <p>{address.line1}</p>
              <p>{address.city}, {address.state} - {address.postal_code}</p>
              <p>{address.phone}</p>
            </div>
          ) : <p>No address</p>}
        </div>
        <div style={{ background: '#fff', padding: 20, borderRadius: 12 }}>
          <h3>Payment</h3>
          <p>Status: {order.payment_status}</p>
          <p>Razorpay order: {order.razorpay_order_id}</p>
          <p>Razorpay payment: {order.razorpay_payment_id}</p>
          <p>Refund: {order.refund_status} {order.refund_amount ? `?${order.refund_amount}` : ''}</p>
          <h3>Totals</h3>
          <p>Subtotal: ?{Number(order.subtotal).toFixed(2)}</p>
          <p>Discount: ?{Number(order.discount).toFixed(2)}</p>
          <p>Delivery: ?{Number(order.delivery_charge).toFixed(2)}</p>
          <p><strong>Total: ?{Number(order.total).toFixed(2)}</strong></p>
        </div>
      </div>

      <div style={{ background: '#fff', padding: 20, borderRadius: 12, marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>Items</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: 8 }}>Product</th>
              <th style={{ padding: 8 }}>Qty</th>
              <th style={{ padding: 8 }}>Price</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: 8 }}>{it.product_name}</td>
                <td style={{ padding: 8 }}>{it.quantity}</td>
                <td style={{ padding: 8 }}>?{Number(it.price).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 24 }}>
        <label>Update status: </label>
        <select value={order.status} onChange={async (e) => {
          await supabase.from('orders').update({ status: e.target.value }).eq('id', id);
          setOrder({ ...order, status: e.target.value });
        }} style={{ padding: 8, borderRadius: 6, border: '1px solid #e5e7eb', marginLeft: 8 }}>
          {['pending','confirmed','processing','shipped','out_for_delivery','delivered','cancelled','returned','refunded'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
    </div>
  );
}
