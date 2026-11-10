import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Banners() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', subtitle: '', image_url: '', sort_order: '0', is_active: true });

  const load = async () => {
    const { data } = await supabase.from('banners').select('*').order('sort_order');
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.title) return;
    await supabase.from('banners').insert({
      title: form.title,
      subtitle: form.subtitle || null,
      image_url: form.image_url || null,
      sort_order: Number(form.sort_order),
      is_active: form.is_active,
    });
    setForm({ title: '', subtitle: '', image_url: '', sort_order: '0', is_active: true });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete banner?')) return;
    await supabase.from('banners').delete().eq('id', id);
    load();
  };

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Banners</h1>
      <div style={{ background: '#fff', padding: 16, borderRadius: 12, marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
        <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} />
        <input placeholder="Subtitle" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} style={inputStyle} />
        <input placeholder="Image URL" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} style={inputStyle} />
        <input placeholder="Sort order" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} style={inputStyle} />
        <button onClick={add} style={{ ...btnStyle, gridColumn: 'span 4' }}>Add banner</button>
      </div>
      <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }}><th style={{ padding: 12 }}>Title</th><th style={{ padding: 12 }}>Image</th><th style={{ padding: 12 }}>Sort</th><th style={{ padding: 12 }}>Active</th><th style={{ padding: 12 }}>Actions</th></tr></thead>
          <tbody>
            {items.map((b) => (
              <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: 12 }}>{b.title}</td>
                <td style={{ padding: 12 }}>{b.image_url ? <img src={b.image_url} alt={b.title} style={{ width: 60, height: 30, objectFit: 'cover' }} /> : '-'}</td>
                <td style={{ padding: 12 }}>{b.sort_order}</td>
                <td style={{ padding: 12 }}>{String(b.is_active)}</td>
                <td style={{ padding: 12 }}><button onClick={() => remove(b.id)} style={{ color: '#dc2626', background: 'transparent', border: 'none', cursor: 'pointer' }}>Delete</button></td>
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
