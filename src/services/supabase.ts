import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || 'placeholder-anon-key';

if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    '[Weblign Store] Supabase environment variables are missing. ' +
      'Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.',
  );
}

const isWebServer = Platform.OS === 'web' && typeof window === 'undefined';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: isWebServer ? undefined : AsyncStorage,
    autoRefreshToken: !isWebServer,
    persistSession: !isWebServer,
    detectSessionInUrl: false,
  },
});

export default supabase;
