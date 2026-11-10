import { supabase } from './supabase';
import type { Address } from '../types';

function mapAddress(row: any): Address {
  return {
    id: row.id,
    userId: row.user_id,
    fullName: row.full_name,
    phone: row.phone,
    line1: row.line1,
    line2: row.line2 ?? undefined,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    country: row.country ?? 'India',
    isDefault: !!row.is_default,
  };
}

export async function fetchAddresses(userId: string): Promise<Address[]> {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapAddress);
}

export async function addAddress(userId: string, address: Omit<Address, 'id' | 'userId'>): Promise<Address> {
  const { data, error } = await supabase
    .from('addresses')
    .insert({
      user_id: userId,
      full_name: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 ?? null,
      city: address.city,
      state: address.state,
      postal_code: address.postalCode,
      country: address.country,
      address_type: (address as any).type ?? 'home',
      is_default: address.isDefault,
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapAddress(data);
}

export async function updateAddress(address: Address & { type?: 'home' | 'work' }): Promise<Address> {
  const { data, error } = await supabase
    .from('addresses')
    .update({
      full_name: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 ?? null,
      city: address.city,
      state: address.state,
      postal_code: address.postalCode,
      country: address.country,
      address_type: (address as any).type ?? 'home',
      is_default: address.isDefault,
    })
    .eq('id', address.id)
    .select('*')
    .single();
  if (error) throw error;
  return mapAddress(data);
}

export async function deleteAddress(id: string): Promise<void> {
  const { error } = await supabase.from('addresses').delete().eq('id', id);
  if (error) throw error;
}

export async function setDefaultAddress(userId: string, id: string): Promise<void> {
  await supabase.from('addresses').update({ is_default: false }).eq('user_id', userId);
  const { error } = await supabase.from('addresses').update({ is_default: true }).eq('id', id);
  if (error) throw error;
}
