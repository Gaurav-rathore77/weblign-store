import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function CustomerDetail() {
  const { id } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: p } = await supabase.from('profiles').select('*').eq('id', id).single();
      setProfile(p);
      const { data: o } = await supabase.from('orders').select('*').eq('user_id', id).order('created_at', { ascending: false });
      setOrders(o ?? []);
    };
    load();
  }, [id]);

  if (!profile) return <div>Loading...</div>;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>{profile.full_name ?? 'Customer'}</h1>
      <div style={{ background: '#fff', padding: 20, borderRadius: 12, marginBottom: 24 }}>
        <p>Phone: {profile.phone ?? '-'}</p>
        <p>Avatar: {profile.avatar_url ? 'Yes' : 'No'}</p>
      </div>
      <h2>Order history</h2>
      <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }}>
              <th style={{ padding: 12 }}>Order ID</th>
              <th style={{ padding: 12 }}>Total</th>
              <th style={{ padding: 12 }}>Status</th>
              <th style={{ padding: 12 }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: 12 }}>{o.id.slice(0, 8)}</td>
                <td style={{ padding: 12 }}>?{Number(o.total).toFixed(2)}</td>
                <td style={{ padding: 12 }}>{o.status}</td>
                <td style={{ padding: 12 }}>{new Date(o.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
