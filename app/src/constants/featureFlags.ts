/**
 * Holistic Wellness Journey - Feature Flags by Subscription Tier
 *
 * Foundation: $29/month - Basic features
 * Transformation: $129/6 months - Full access + trial
 * Lifetime: $249/year - Full access + premium extras
 */

export type SubscriptionTier = 'foundation' | 'transformation' | 'lifetime' | 'none';

// Feature type for easy usage
export type Feature = keyof TierFeatures;

export interface TierFeatures {
  // Daily content
  dailyLessonUnlock: boolean;
  dailyReflectionPrompt: boolean;
  dailyMovementSuggestion: 'basic' | 'personalized' | 'personalized_with_video';
  dailyAffirmation: boolean;
  dailyNourishmentTip: boolean;
  dailyCheckInRewards: boolean | 'with_bonus';

  // Quiz features
  quizRetakeWait: 'immediate' | '24_hours';

  // Content access
  voiceNotes: boolean;
  communityCircle: boolean | 'priority';
  recipeLibrary: 'limited' | 'full' | 'full_exclusive';
  movementVideoLibrary: boolean | 'with_live';

  // Community features
  communityFeed: boolean;
  communityPosting: boolean;
  communityFollowingLimit: number; // 0 = no access, -1 = unlimited

  // Offline & Export
  offlineMode: 'current_lesson' | 'current_chapter' | 'full_phase';
  journalExport: boolean | 'pdf' | 'pdf_csv';

  // Extra features
  milestoneCelebrations: 'basic' | 'full' | 'full_personal';
  startFreshFeature: boolean;
}

export const TIER_FEATURES: Record<SubscriptionTier, TierFeatures> = {
  none: {
    dailyLessonUnlock: false,
    dailyReflectionPrompt: false,
    dailyMovementSuggestion: 'basic',
    dailyAffirmation: false,
    dailyNourishmentTip: false,
    dailyCheckInRewards: false,
    quizRetakeWait: '24_hours',
    voiceNotes: false,
    communityCircle: false,
    recipeLibrary: 'limited',
    movementVideoLibrary: false,
    communityFeed: false,
    communityPosting: false,
    communityFollowingLimit: 0,
    offlineMode: 'current_lesson',
    journalExport: false,
    milestoneCelebrations: 'basic',
    startFreshFeature: false,
  },
  foundation: {
    dailyLessonUnlock: true,
    dailyReflectionPrompt: true,
    dailyMovementSuggestion: 'basic',
    dailyAffirmation: false,
    dailyNourishmentTip: false,
    dailyCheckInRewards: false,
    quizRetakeWait: '24_hours',
    voiceNotes: false,
    communityCircle: false,
    recipeLibrary: 'limited',
    movementVideoLibrary: false,
    communityFeed: false,
    communityPosting: false,
    communityFollowingLimit: 0,
    offlineMode: 'current_lesson',
    journalExport: false,
    milestoneCelebrations: 'basic',
    startFreshFeature: false,
  },
  transformation: {
    dailyLessonUnlock: true,
    dailyReflectionPrompt: true,
    dailyMovementSuggestion: 'personalized',
    dailyAffirmation: true,
    dailyNourishmentTip: true,
    dailyCheckInRewards: true,
    quizRetakeWait: '24_hours',
    voiceNotes: true,
    communityCircle: true,
    recipeLibrary: 'full',
    movementVideoLibrary: true,
    communityFeed: true,
    communityPosting: true,
    communityFollowingLimit: 50,
    offlineMode: 'current_chapter',
    journalExport: 'pdf',
    milestoneCelebrations: 'full',
    startFreshFeature: true,
  },
  lifetime: {
    dailyLessonUnlock: true,
    dailyReflectionPrompt: true,
    dailyMovementSuggestion: 'personalized_with_video',
    dailyAffirmation: true,
    dailyNourishmentTip: true,
    dailyCheckInRewards: 'with_bonus',
    quizRetakeWait: 'immediate',
    voiceNotes: true,
    communityCircle: 'priority',
    recipeLibrary: 'full_exclusive',
    movementVideoLibrary: 'with_live',
    communityFeed: true,
    communityPosting: true,
    communityFollowingLimit: -1, // Unlimited
    offlineMode: 'full_phase',
    journalExport: 'pdf_csv',
    milestoneCelebrations: 'full_personal',
    startFreshFeature: true,
  },
};

// Pricing information
export const SUBSCRIPTION_PRICING = {
  foundation: {
    price: 29,
    currency: 'USD',
    period: 'monthly',
    perMonth: 29,
    hasTrial: false,
  },
  transformation: {
    price: 129,
    currency: 'USD',
    period: '6_months',
    perMonth: 21.5,
    hasTrial: true,
    trialDays: 7,
  },
  lifetime: {
    price: 249,
    currency: 'USD',
    period: 'yearly',
    perMonth: 20.75,
    hasTrial: false,
  },
};

// Helper function to check feature access
export function hasFeature(
  tier: SubscriptionTier | undefined | null,
  feature: keyof TierFeatures
): boolean {
  const safeTier = tier || 'none';
  const features = TIER_FEATURES[safeTier];
  const value = features[feature];
  return value !== false && value !== 'limited' && value !== 'basic';
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
