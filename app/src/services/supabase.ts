import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from './database.types';

// Export the Database type for use in other files
export type { Database };

// Environment variables (replace with actual values or use expo-constants)
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if we have valid Supabase configuration
const isValidUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && !url.includes('placeholder');
  } catch {
    return false;
  }
};

const isConfigured = isValidUrl(SUPABASE_URL) && SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.includes('placeholder');

// Create Supabase client (or null if not configured)
export const supabase = isConfigured
  ? createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })
  : null;

// Flag to check if Supabase is available
export const isSupabaseConfigured = isConfigured;

/**
 * Get the Supabase client, throwing if not configured.
 * Use this in service functions that require Supabase.
 */
export function getSupabase(): SupabaseClient<Database> {
  if (!supabase) {
    throw new Error('Supabase is not configured. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
  }
  return supabase;
}

// Helper to get current user
export async function getCurrentUser() {
  if (!supabase) return null;
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

// Helper to get current session
export async function getCurrentSession() {
  if (!supabase) return null;
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

export default supabase;
