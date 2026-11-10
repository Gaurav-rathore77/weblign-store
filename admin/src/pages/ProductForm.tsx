import React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState<any>({
    name: '', description: '', price: '', compare_at_price: '', category_id: '', brand: '',
    stock: '0', rating: '0', review_count: '0', is_trending: false, is_best_seller: false, is_new_arrival: false,
    sizes: '', colors: '', specifications: '', images: [] as string[],
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => setCategories(data ?? []));
    if (isEdit) {
      supabase.from('products').select('*').eq('id', id).single().then(({ data }) => {
        if (data) {
          setForm({
            name: data.name ?? '',
            description: data.description ?? '',
            price: String(data.price ?? ''),
            compare_at_price: data.compare_at_price != null ? String(data.compare_at_price) : '',
            category_id: data.category_id ?? '',
            brand: data.brand ?? '',
            stock: String(data.stock ?? 0),
            rating: String(data.rating ?? 0),
            review_count: String(data.review_count ?? 0),
            is_trending: !!data.is_trending,
            is_best_seller: !!data.is_best_seller,
            is_new_arrival: !!data.is_new_arrival,
            sizes: (data.sizes ?? []).join(', '),
            colors: (data.colors ?? []).join(', '),
            specifications: Array.isArray(data.specifications) ? data.specifications.map((s: any) => `${s.label}:${s.value}`).join(', ') : '',
            images: data.images ?? (data.image_url ? [data.image_url] : []),
          });
        }
      });
    }
  }, [id, isEdit]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const newImages = [...form.images];
    for (const file of Array.from(files)) {
      const path = `products/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('product-images').upload(path, file, { upsert: true });
      if (error) { alert(error.message); continue; }
      const { data } = supabase.storage.from('product-images').getPublicUrl(path);
      newImages.push(data.publicUrl);
    }
    setForm({ ...form, images: newImages });
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const sizes = form.sizes.split(',').map((s: string) => s.trim()).filter(Boolean);
    const colors = form.colors.split(',').map((s: string) => s.trim()).filter(Boolean);
    const specifications = form.specifications.split(',').map((s: string) => {
      const [label, value] = s.split(':').map((x) => x.trim());
      return label && value ? { label, value } : null;
    }).filter(Boolean);

    const payload: any = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
      category_id: form.category_id || null,
      brand: form.brand || null,
      stock: Number(form.stock),
      rating: Number(form.rating),
      review_count: Number(form.review_count),
      is_trending: form.is_trending,
      is_best_seller: form.is_best_seller,
      is_new_arrival: form.is_new_arrival,
      sizes,
      colors,
      specifications,
      images: form.images,
      image_url: form.images[0] ?? null,
    };

    let error;
    if (isEdit) {
      ({ error } = await supabase.from('products').update(payload).eq('id', id));
    } else {
      ({ error } = await supabase.from('products').insert(payload));
    }
    setSaving(false);
    if (error) alert(error.message);
    else navigate('/products');
  };

  const update = (key: string, value: any) => setForm({ ...form, [key]: value });

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>{isEdit ? 'Edit product' : 'Add product'}</h1>
      <div style={{ background: '#fff', padding: 24, borderRadius: 12, maxWidth: 720 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label>Name</label>
            <input value={form.name} onChange={(e) => update('name', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label>Brand</label>
            <input value={form.brand} onChange={(e) => update('brand', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label>Price</label>
            <input type="number" value={form.price} onChange={(e) => update('price', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label>Compare at price</label>
            <input type="number" value={form.compare_at_price} onChange={(e) => update('compare_at_price', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label>Stock</label>
            <input type="number" value={form.stock} onChange={(e) => update('stock', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label>Category</label>
            <select value={form.category_id} onChange={(e) => update('category_id', e.target.value)} style={inputStyle}>
              <option value="">Select category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <label>Description</label>
          <textarea value={form.description} onChange={(e) => update('description', e.target.value)} style={{ ...inputStyle, height: 100 }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
          <div>
            <label>Sizes (comma separated)</label>
            <input value={form.sizes} onChange={(e) => update('sizes', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label>Colors (comma separated)</label>
            <input value={form.colors} onChange={(e) => update('colors', e.target.value)} style={inputStyle} />
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <label>Specifications (label:value, comma separated)</label>
          <input value={form.specifications} onChange={(e) => update('specifications', e.target.value)} style={inputStyle} />
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 16 }}>
          <label><input type="checkbox" checked={form.is_trending} onChange={(e) => update('is_trending', e.target.checked)} /> Trending</label>
          <label><input type="checkbox" checked={form.is_best_seller} onChange={(e) => update('is_best_seller', e.target.checked)} /> Best seller</label>
          <label><input type="checkbox" checked={form.is_new_arrival} onChange={(e) => update('is_new_arrival', e.target.checked)} /> New arrival</label>
        </div>

        <div style={{ marginTop: 16 }}>
          <label>Upload images</label>
          <input type="file" multiple accept="image/*" onChange={handleUpload} />
          {uploading ? <div>Uploading...</div> : null}
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            {form.images.map((url: string, i: number) => (
              <img key={i} src={url} alt="product" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8 }} />
            ))}
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <button onClick={handleSave} disabled={saving} style={{ background: '#2563eb', color: '#fff', padding: '12px 24px', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
            {saving ? 'Saving...' : 'Save product'}
          </button>
          <button onClick={() => navigate('/products')} style={{ marginLeft: 12, background: 'transparent', border: '1px solid #e5e7eb', padding: '12px 24px', borderRadius: 8, cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: 10,
  marginTop: 4,
  borderRadius: 8,
  border: '1px solid #e5e7eb',
};
