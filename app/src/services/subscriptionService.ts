import { getSupabase, isSupabaseConfigured } from './supabase';
import type { Subscription, SubscriptionPlan, SubscriptionStatus } from './database.types';
import { TIER_FEATURES, SUBSCRIPTION_PRICING, type TierFeatures } from '@/constants/featureFlags';

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
 * Check if user has an active subscription
 */
export async function hasActiveSubscription(): Promise<boolean> {
  const subscription = await getSubscription();

  if (!subscription) return false;

  return subscription.status === 'active' || subscription.status === 'trial';
}

/**
 * Get subscription tier/plan
 */
export async function getSubscriptionTier(): Promise<SubscriptionPlan | 'none'> {
  const subscription = await getSubscription();

  if (!subscription) return 'none';

  if (subscription.status === 'active' || subscription.status === 'trial') {
    return subscription.plan;
  }

  return 'none';
}

/**
 * Check if user is in trial period
 */
export async function isInTrial(): Promise<boolean> {
  const subscription = await getSubscription();

  if (!subscription) return false;

  return subscription.status === 'trial';
}

/**
 * Get trial days remaining
 */
export async function getTrialDaysRemaining(): Promise<number> {
  const subscription = await getSubscription();

  if (!subscription || subscription.status !== 'trial' || !subscription.trial_end_date) {
    return 0;
  }

  const trialEnd = new Date(subscription.trial_end_date);
  const now = new Date();
  const diffTime = trialEnd.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Get features available for current subscription
 */
export async function getAvailableFeatures(): Promise<TierFeatures> {
  const tier = await getSubscriptionTier();
  return TIER_FEATURES[tier];
}

/**
 * Check if a specific feature is available
 */
export async function hasFeature(feature: keyof TierFeatures): Promise<boolean> {
  const features = await getAvailableFeatures();
  const value = features[feature];

  // Feature is available if it's not false, 'limited', or 'basic'
  return value !== false && value !== 'limited' && value !== 'basic';
}

/**
 * Get pricing info for a plan
 */
export function getPlanPricing(plan: SubscriptionPlan) {
  return SUBSCRIPTION_PRICING[plan];
}

/**
 * Format price for display
 */
export function formatPrice(plan: SubscriptionPlan): string {
  const pricing = getPlanPricing(plan);
  return `$${pricing.price}`;
}

/**
 * Format period for display
 */
export function formatPeriod(plan: SubscriptionPlan): string {
  const pricing = getPlanPricing(plan);
  switch (pricing.period) {
    case 'monthly':
      return 'per month';
    case '6_months':
      return 'for 6 months';
    case 'yearly':
      return 'per year';
    default:
      return '';
  }
}

/**
 * Calculate per-month cost for display
 */
export function getPerMonthCost(plan: SubscriptionPlan): string {
  const pricing = getPlanPricing(plan);
  return `$${pricing.perMonth.toFixed(2)}`;
}

/**
 * Create a subscription record (called after RevenueCat purchase)
 * This would typically be called from a webhook, but can also be client-side
 */
export async function createSubscription(
  plan: SubscriptionPlan,
  revenueCatCustomerId: string,
  periodStart: Date,
  periodEnd: Date,
  isTrialPeriod: boolean = false
): Promise<Subscription> {
  const { data: { user } } = await getSupabase().auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const trialEndDate = isTrialPeriod
    ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { data, error } = await getSupabase()
    .from('subscriptions')
    .upsert({
      user_id: user.id,
      plan,
      status: isTrialPeriod ? 'trial' : 'active',
      trial_end_date: trialEndDate,
      current_period_start: periodStart.toISOString(),
      current_period_end: periodEnd.toISOString(),
      revenuecat_customer_id: revenueCatCustomerId,
    }, {
      onConflict: 'user_id',
    })
    .select()
    .single();

  if (error) throw error;

  // Also update user progress with subscription start date
  await getSupabase()
    .from('user_progress')
    .update({ subscription_start_date: periodStart.toISOString() })
    .eq('user_id', user.id);

  return data;
}

/**
 * Update subscription status (for webhook handling)
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
 * Handle trial conversion (called when trial ends and user pays)
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
 * Complete program — cancel billing but grant lifetime access
 * Called automatically when user completes all 180 lessons
 */
export async function completeProgram(): Promise<void> {
  const { data: { user } } = await getSupabase().auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { error } = await getSupabase()
    .from('subscriptions')
    .update({
      status: 'completed',
      plan: 'lifetime',
    })
    .eq('user_id', user.id);

  if (error) throw error;
}

/**
 * Subscription comparison for upgrade/downgrade
 */
export function comparePlans(current: SubscriptionPlan, target: SubscriptionPlan): 'upgrade' | 'downgrade' | 'same' {
  const planOrder: SubscriptionPlan[] = ['foundation', 'transformation', 'lifetime'];
  const currentIndex = planOrder.indexOf(current);
  const targetIndex = planOrder.indexOf(target);

  if (currentIndex < targetIndex) return 'upgrade';
  if (currentIndex > targetIndex) return 'downgrade';
  return 'same';
}
