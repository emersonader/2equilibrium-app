import { getSupabase } from './supabase';
import type { Profile, Json } from './database.types';

export interface SignUpData {
  email: string;
  password: string;
  fullName?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

/**
 * Sign up a new user
 */
export async function signUp({ email, password, fullName }: SignUpData) {
  const client = getSupabase();
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) throw error;
  return data;
}

/**
 * Sign in with email and password
 */
export async function signIn({ email, password }: SignInData) {
  const client = getSupabase();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

/**
 * Sign in with OAuth provider
 */
export async function signInWithProvider(provider: 'google' | 'apple') {
  const client = getSupabase();
  const { data, error } = await client.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: 'wellness://auth/callback',
    },
  });

  if (error) throw error;
  return data;
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const client = getSupabase();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string) {
  const client = getSupabase();
  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: 'wellness://auth/reset-password',
  });

  if (error) throw error;
}

/**
 * Update password
 */
export async function updatePassword(newPassword: string) {
  const client = getSupabase();
  const { error } = await client.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
}

/**
 * Ensure user profile exists (create if missing)
 */
export async function ensureProfileExists(): Promise<Profile> {
  const client = getSupabase();
  const { data: { user } } = await client.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  // Try to get existing profile
  const { data: existingProfile, error: fetchError } = await client
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (existingProfile) return existingProfile;

  // Profile doesn't exist, create it
  if (fetchError && fetchError.code === 'PGRST116') {
    const fullName = user.user_metadata?.full_name || null;

    const { data: newProfile, error: insertError } = await client
      .from('profiles')
      .insert({
        id: user.id,

        // Website compatibility fields
        email: user.email!,
        name: fullName || user.email!,
        tier: 'foundation',
        is_admin: false,

        // Mobile app fields
        full_name: fullName,
        avatar_url: null,
        onboarding_completed: false,
        notification_preferences: {
          morningWisdom: true,
          lessonReminder: true,
          gentleNudge: true,
          streakReminder: true,
          weeklyReview: true,
          quietHoursStart: '22:00',
          quietHoursEnd: '07:00',
        },
      })
      .select()
      .single();

    if (insertError) throw insertError;
    return newProfile;
  }

  if (fetchError) throw fetchError;
  throw new Error('Failed to get or create profile');
}

/**
 * Get current user's profile
 */
export async function getProfile(): Promise<Profile | null> {
  const client = getSupabase();
  const { data: { user } } = await client.auth.getUser();

  if (!user) return null;

  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // PGRST116 = no rows found - profile doesn't exist yet
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

/**
 * Update current user's profile
 */
export async function updateProfile(updates: {
  fullName?: string;
  avatarUrl?: string;
  onboardingCompleted?: boolean;
  notificationPreferences?: Record<string, unknown>;
}) {
  const client = getSupabase();
  const { data: { user } } = await client.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await client
    .from('profiles')
    .update({
      full_name: updates.fullName,
      name: updates.fullName, // Sync with website field
      avatar_url: updates.avatarUrl,
      onboarding_completed: updates.onboardingCompleted,
      notification_preferences: updates.notificationPreferences as Json | undefined,
    })
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(
  callback: (event: string, session: unknown) => void
) {
  const client = getSupabase();
  return client.auth.onAuthStateChange(callback);
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const client = getSupabase();
  const { data: { session } } = await client.auth.getSession();
  return !!session;
}
