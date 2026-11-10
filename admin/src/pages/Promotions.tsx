import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Promotions() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', body: '', image_url: '' });

  const load = async () => {
    const { data } = await supabase.from('promotions').select('*').order('created_at', { ascending: false });
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.title) return;
    await supabase.from('promotions').insert({ title: form.title, body: form.body || null, image_url: form.image_url || null, active: true });
    setForm({ title: '', body: '', image_url: '' });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete promotion?')) return;
    await supabase.from('promotions').delete().eq('id', id);
    load();
  };

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Promotions</h1>
      <div style={{ background: '#fff', padding: 16, borderRadius: 12, marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} />
        <input placeholder="Body" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} style={inputStyle} />
        <input placeholder="Image URL" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} style={inputStyle} />
        <button onClick={add} style={{ ...btnStyle, gridColumn: 'span 3' }}>Create promotion</button>
      </div>
      <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }}><th style={{ padding: 12 }}>Title</th><th style={{ padding: 12 }}>Body</th><th style={{ padding: 12 }}>Actions</th></tr></thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: 12 }}>{p.title}</td>
                <td style={{ padding: 12 }}>{p.body}</td>
                <td style={{ padding: 12 }}><button onClick={() => remove(p.id)} style={{ color: '#dc2626', background: 'transparent', border: 'none', cursor: 'pointer' }}>Delete</button></td>
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
