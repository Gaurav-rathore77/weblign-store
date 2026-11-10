import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState({ sales: 0, orders: 0, customers: 0, products: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const [products, orders, profiles] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
      ]);
      const totalSales = (orders.data ?? []).reduce((sum: number, o: any) => sum + Number(o.total), 0);
      setStats({
        sales: totalSales,
        orders: orders.data?.length ?? 0,
        customers: profiles.count ?? 0,
        products: products.count ?? 0,
      });
      setRecentOrders((orders.data ?? []).slice(0, 8));

      // aggregate sales by day (last 7)
      const byDay: Record<string, number> = {};
      (orders.data ?? []).forEach((o: any) => {
        const day = new Date(o.created_at).toLocaleDateString();
        byDay[day] = (byDay[day] ?? 0) + Number(o.total);
      });
      setSalesData(Object.entries(byDay).slice(-7).map(([name, value]) => ({ name, value })));
    };
    load();
  }, []);

  const card = (label: string, value: string | number) => (
    <div style={{ background: '#fff', padding: 20, borderRadius: 12, flex: 1, minWidth: 180 }}>
      <div style={{ color: '#6b7280', fontSize: 13 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, marginTop: 6 }}>{value}</div>
    </div>
  );

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Dashboard</h1>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        {card('Total Sales', `?${stats.sales.toFixed(2)}`)}
        {card('Total Orders', stats.orders)}
        {card('Total Customers', stats.customers)}
        {card('Total Products', stats.products)}
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ background: '#fff', padding: 20, borderRadius: 12, flex: 2, minWidth: 300, height: 320 }}>
          <h3 style={{ marginTop: 0 }}>Revenue</h3>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: '#fff', padding: 20, borderRadius: 12, flex: 1, minWidth: 280 }}>
          <h3 style={{ marginTop: 0 }}>Orders by day</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: '#fff', padding: 20, borderRadius: 12, marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>Recent Orders</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: 8 }}>Order ID</th>
              <th style={{ padding: 8 }}>Total</th>
              <th style={{ padding: 8 }}>Status</th>
              <th style={{ padding: 8 }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((o) => (
              <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: 8 }}>{o.id.slice(0, 8)}</td>
                <td style={{ padding: 8 }}>?{Number(o.total).toFixed(2)}</td>
                <td style={{ padding: 8 }}>{o.status}</td>
                <td style={{ padding: 8 }}>{new Date(o.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
