import { getSupabase, isSupabaseConfigured } from './supabase';
import type { Subscription, SubscriptionStatus } from './database.types';

/**
 * Get current user's subscription
 */
export async function getSubscription(): Promise<Subscription | null> {
  if (!isSupabaseConfigured) return null;

  const client = getSupabase();
  const { data: { user } } = await client.auth.getUser();

  if (!user) return null;

  const { data, error } = await client
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

/**
 * Check if user has an active subscription (active, trial, or in recap period)
 */
export async function hasActiveSubscription(): Promise<boolean> {
  const subscription = await getSubscription();

  if (!subscription) return false;

  if (subscription.status === 'active' || subscription.status === 'trial') return true;

  // Check if in 60-day recap window after program completion
  if (subscription.status === 'completed' && subscription.recap_expires_at) {
    return new Date(subscription.recap_expires_at) > new Date();
  }

  return false;
}

/**
 * Update subscription status (called from webhook handler or admin)
 */
export async function updateSubscriptionStatus(
  userId: string,
  status: SubscriptionStatus,
  periodEnd?: Date
): Promise<void> {
  const updateData: Record<string, unknown> = { status };

  if (periodEnd) {
    updateData.current_period_end = periodEnd.toISOString();
  }

  const { error } = await getSupabase()
    .from('subscriptions')
    .update(updateData)
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Convert trial to active
 */
export async function convertTrialToActive(): Promise<Subscription> {
  const { data: { user } } = await getSupabase().auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await getSupabase()
    .from('subscriptions')
    .update({
      status: 'active',
      trial_end_date: null,
    })
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(): Promise<void> {
  const { data: { user } } = await getSupabase().auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { error } = await getSupabase()
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('user_id', user.id);

  if (error) throw error;
}

/**
 * Complete program — mark complete and grant 60-day recap access.
 * Called automatically when user completes all 180 lessons.
 * Stripe billing is cancelled separately via webhook.
 */
export async function completeProgram(): Promise<void> {
  const { data: { user } } = await getSupabase().auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const recapExpiry = new Date();
  recapExpiry.setDate(recapExpiry.getDate() + 60);

  const { error } = await getSupabase()
    .from('subscriptions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      recap_expires_at: recapExpiry.toISOString(),
    })
    .eq('user_id', user.id);

  if (error) throw error;
}

/**
 * Check if user is in recap period (60 days after completing all 180 lessons)
 */
export async function isInRecapPeriod(): Promise<{
  inRecap: boolean;
  daysRemaining: number;
  expiresAt: string | null;
}> {
  const { data: { user } } = await getSupabase().auth.getUser();
  if (!user) return { inRecap: false, daysRemaining: 0, expiresAt: null };

  const { data, error } = await getSupabase()
    .from('subscriptions')
    .select('status, recap_expires_at')
    .eq('user_id', user.id)
    .single();

  if (error || !data || data.status !== 'completed' || !data.recap_expires_at) {
    return { inRecap: false, daysRemaining: 0, expiresAt: null };
  }

  const expiresAt = new Date(data.recap_expires_at);
  const diffMs = expiresAt.getTime() - Date.now();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  return {
    inRecap: daysRemaining > 0,
    daysRemaining,
    expiresAt: data.recap_expires_at,
  };
}
