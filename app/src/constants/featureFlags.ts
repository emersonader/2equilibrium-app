/**
 * Holistic Wellness Journey - Feature Flags
 *
 * Two states: 'none' (no subscription) and 'subscribed' (active Stripe subscription).
 * All features unlock with any active subscription.
 */

export type SubscriptionTier = 'subscribed' | 'none';

// Feature type for easy usage
export type Feature = keyof TierFeatures;

export interface TierFeatures {
  // Daily content
  dailyLessonUnlock: boolean;
  dailyReflectionPrompt: boolean;
  dailyMovementSuggestion: boolean;
  dailyAffirmation: boolean;
  dailyNourishmentTip: boolean;
  dailyCheckInRewards: boolean;

  // Quiz features
  quizRetakeWait: 'immediate' | '24_hours';

  // Content access
  voiceNotes: boolean;
  communityCircle: boolean;
  recipeLibrary: boolean;
  movementVideoLibrary: boolean;

  // Community features
  communityFeed: boolean;
  communityPosting: boolean;

  // Offline & Export
  offlineMode: boolean;
  journalExport: boolean;

  // Extra features
  milestoneCelebrations: boolean;
  startFreshFeature: boolean;
}

export const TIER_FEATURES: Record<SubscriptionTier, TierFeatures> = {
  none: {
    dailyLessonUnlock: false,
    dailyReflectionPrompt: false,
    dailyMovementSuggestion: false,
    dailyAffirmation: false,
    dailyNourishmentTip: false,
    dailyCheckInRewards: false,
    quizRetakeWait: '24_hours',
    voiceNotes: false,
    communityCircle: false,
    recipeLibrary: false,
    movementVideoLibrary: false,
    communityFeed: false,
    communityPosting: false,
    offlineMode: false,
    journalExport: false,
    milestoneCelebrations: false,
    startFreshFeature: false,
  },
  subscribed: {
    dailyLessonUnlock: true,
    dailyReflectionPrompt: true,
    dailyMovementSuggestion: true,
    dailyAffirmation: true,
    dailyNourishmentTip: true,
    dailyCheckInRewards: true,
    quizRetakeWait: 'immediate',
    voiceNotes: true,
    communityCircle: true,
    recipeLibrary: true,
    movementVideoLibrary: true,
    communityFeed: true,
    communityPosting: true,
    offlineMode: true,
    journalExport: true,
    milestoneCelebrations: true,
    startFreshFeature: true,
  },
};

// Pricing information (single plan)
export const SUBSCRIPTION_PRICING = {
  premium: {
    price: 19.99,
    currency: 'USD',
    period: 'monthly',
    perMonth: 19.99,
    hasTrial: false,
  },
};

// Stripe checkout URL — subscription is purchased on the web
export const STRIPE_CHECKOUT_URL = 'https://www.2equilibrium.com/subscribe';

// Helper function to check feature access
export function hasFeature(
  tier: SubscriptionTier | undefined | null,
  feature: keyof TierFeatures
): boolean {
  const safeTier = tier || 'none';
  const value = TIER_FEATURES[safeTier][feature];
  return value === true || value === 'immediate';
}

// Helper to get feature value
export function getFeatureValue<K extends keyof TierFeatures>(
  tier: SubscriptionTier | undefined | null,
  feature: K
): TierFeatures[K] {
  const safeTier = tier || 'none';
  return TIER_FEATURES[safeTier][feature];
}

export default TIER_FEATURES;
