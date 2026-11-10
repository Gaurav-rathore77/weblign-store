import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';
import type { Profile } from '../types';

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) return null;
  if (!data) return null;
  return {
    id: data.id,
    fullName: data.full_name,
    avatarUrl: data.avatar_url,
    phone: data.phone,
  };
}

export async function upsertProfile(userId: string, updates: Partial<Profile> & { notificationOrders?: boolean; notificationOffers?: boolean; notificationPush?: boolean }): Promise<void> {
  const payload: any = { id: userId, updated_at: new Date().toISOString() };
  if (updates.fullName !== undefined) payload.full_name = updates.fullName;
  if (updates.phone !== undefined) payload.phone = updates.phone;
  if (updates.avatarUrl !== undefined) payload.avatar_url = updates.avatarUrl;
  if (updates.notificationOrders !== undefined) payload.notification_orders = updates.notificationOrders;
  if (updates.notificationOffers !== undefined) payload.notification_offers = updates.notificationOffers;
  if (updates.notificationPush !== undefined) payload.notification_push = updates.notificationPush;

  const { error } = await supabase.from('profiles').upsert(payload);
  if (error) throw error;
}

export async function pickAndUploadAvatar(userId: string): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });

  if (result.canceled || !result.assets?.length) return null;

  const asset = result.assets[0];
  const response = await fetch(asset.uri);
  const blob = await response.blob();
  const ext = asset.uri.split('.').pop() ?? 'jpg';
  const path = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage.from('avatars').upload(path, blob, { upsert: true });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}
