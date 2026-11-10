import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('orders').select('*, profiles(full_name, email)').order('created_at', { ascending: false });
    setOrders(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', id);
    load();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Orders</h1>
      <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }}>
              <th style={{ padding: 12 }}>Order ID</th>
              <th style={{ padding: 12 }}>Customer</th>
              <th style={{ padding: 12 }}>Total</th>
              <th style={{ padding: 12 }}>Payment</th>
              <th style={{ padding: 12 }}>Status</th>
              <th style={{ padding: 12 }}>Date</th>
              <th style={{ padding: 12 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: 12 }}><Link to={`/orders/${o.id}`}>{o.id.slice(0, 8)}</Link></td>
                <td style={{ padding: 12 }}>{o.profiles?.full_name ?? o.profiles?.email ?? '-'}</td>
                <td style={{ padding: 12 }}>?{Number(o.total).toFixed(2)}</td>
                <td style={{ padding: 12 }}>{o.payment_status}</td>
                <td style={{ padding: 12 }}>
                  <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)} style={{ padding: 6, borderRadius: 6, border: '1px solid #e5e7eb' }}>
                    {['pending','confirmed','processing','shipped','out_for_delivery','delivered','cancelled','returned','refunded'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td style={{ padding: 12 }}>{new Date(o.created_at).toLocaleDateString()}</td>
                <td style={{ padding: 12 }}><Link to={`/orders/${o.id}`}>View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
