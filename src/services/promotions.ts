import { supabase } from './supabase';

export async function fetchPromotions() {
  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    imageUrl: row.image_url,
    link: row.link,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
  }));
}
