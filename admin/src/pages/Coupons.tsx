import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Coupons() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ code: '', discount_type: 'percent', discount_value: '', min_order: '', expires_at: '' });

  const load = async () => {
    const { data } = await supabase.from('coupons').select('*').order('code');
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.code || !form.discount_value) return;
    await supabase.from('coupons').insert({
      code: form.code.toUpperCase(),
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      min_order: form.min_order ? Number(form.min_order) : 0,
      expires_at: form.expires_at || null,
      active: true,
    });
    setForm({ code: '', discount_type: 'percent', discount_value: '', min_order: '', expires_at: '' });
    load();
  };

  const remove = async (code: string) => {
    if (!confirm('Delete coupon?')) return;
    await supabase.from('coupons').delete().eq('code', code);
    load();
  };

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Coupons</h1>
      <div style={{ background: '#fff', padding: 16, borderRadius: 12, marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
        <input placeholder="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} style={inputStyle} />
        <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })} style={inputStyle}>
          <option value="percent">Percent</option>
          <option value="fixed">Fixed</option>
        </select>
        <input placeholder="Value" type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} style={inputStyle} />
        <input placeholder="Min order" type="number" value={form.min_order} onChange={(e) => setForm({ ...form, min_order: e.target.value })} style={inputStyle} />
        <input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} style={inputStyle} />
        <button onClick={add} style={{ ...btnStyle, gridColumn: 'span 5' }}>Create coupon</button>
      </div>
      <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }}><th style={{ padding: 12 }}>Code</th><th style={{ padding: 12 }}>Type</th><th style={{ padding: 12 }}>Value</th><th style={{ padding: 12 }}>Min order</th><th style={{ padding: 12 }}>Expires</th><th style={{ padding: 12 }}>Actions</th></tr></thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.code} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: 12 }}>{c.code}</td>
                <td style={{ padding: 12 }}>{c.discount_type}</td>
                <td style={{ padding: 12 }}>{c.discount_value}</td>
                <td style={{ padding: 12 }}>{c.min_order}</td>
                <td style={{ padding: 12 }}>{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : '-'}</td>
                <td style={{ padding: 12 }}><button onClick={() => remove(c.code)} style={{ color: '#dc2626', background: 'transparent', border: 'none', cursor: 'pointer' }}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = { padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' };
const btnStyle: React.CSSProperties = { background: '#2563eb', color: '#fff', padding: '10px 16px', border: 'none', borderRadius: 8, cursor: 'pointer' };
