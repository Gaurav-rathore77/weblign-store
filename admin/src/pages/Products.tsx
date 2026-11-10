import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false });
    setProducts(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await supabase.from('products').delete().eq('id', id);
    load();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Products</h1>
        <Link to="/products/new" style={{ background: '#2563eb', color: '#fff', padding: '10px 16px', borderRadius: 8, textDecoration: 'none' }}>+ Add product</Link>
      </div>
      <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }}>
              <th style={{ padding: 12 }}>Image</th>
              <th style={{ padding: 12 }}>Name</th>
              <th style={{ padding: 12 }}>Category</th>
              <th style={{ padding: 12 }}>Price</th>
              <th style={{ padding: 12 }}>Stock</th>
              <th style={{ padding: 12 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: 12 }}>
                  {p.image_url ? <img src={p.image_url} alt={p.name} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }} /> : '-'}
                </td>
                <td style={{ padding: 12 }}>{p.name}</td>
                <td style={{ padding: 12 }}>{p.categories?.name ?? '-'}</td>
                <td style={{ padding: 12 }}>?{Number(p.price).toFixed(2)}</td>
                <td style={{ padding: 12 }}>{p.stock}</td>
                <td style={{ padding: 12 }}>
                  <Link to={`/products/${p.id}/edit`} style={{ marginRight: 12, color: '#2563eb' }}>Edit</Link>
                  <button onClick={() => handleDelete(p.id)} style={{ color: '#dc2626', background: 'transparent', border: 'none', cursor: 'pointer' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
