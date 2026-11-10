import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Categories() {
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  const load = async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!name || !slug) return;
    await supabase.from('categories').insert({ name, slug });
    setName(''); setSlug('');
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete category?')) return;
    await supabase.from('categories').delete().eq('id', id);
    load();
  };

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Categories</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
        <input placeholder="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} style={inputStyle} />
        <button onClick={add} style={btnStyle}>Add</button>
      </div>
      <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }}><th style={{ padding: 12 }}>Name</th><th style={{ padding: 12 }}>Slug</th><th style={{ padding: 12 }}>Actions</th></tr></thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: 12 }}>{c.name}</td>
                <td style={{ padding: 12 }}>{c.slug}</td>
                <td style={{ padding: 12 }}><button onClick={() => remove(c.id)} style={{ color: '#dc2626', background: 'transparent', border: 'none', cursor: 'pointer' }}>Delete</button></td>
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
