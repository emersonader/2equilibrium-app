import { useCallback } from 'react';
import { useUserStore } from '@/stores/userStore';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { TIER_FEATURES, type Feature, type SubscriptionTier } from '@/constants/featureFlags';

/**
 * Hook for subscription-related functionality
 */
export function useSubscription() {
  const { subscription } = useUserStore();
  const { subscriptionStatus, currentTier: tier, recapDaysRemaining, refreshStatus } = useSubscriptionStore();

  // Active if paying or in 60-day recap window after completing 180 lessons
  const isActive = subscriptionStatus === 'active' || subscriptionStatus === 'completed';

  // True only while paying (not in recap window)
  const isPaying = subscriptionStatus === 'active';

  // In the 60-day recap window after program completion
  const isInRecapPeriod = subscriptionStatus === 'completed';

  // Check if user has a specific feature
  const hasFeature = useCallback(
    (feature: Feature): boolean => {
      const value = TIER_FEATURES[tier][feature];
      return value === true || value === 'immediate';
    },
    [tier]
  );

  // Get feature value
  const getFeatureValue = useCallback(
    (feature: Feature) => {
      return TIER_FEATURES[tier][feature];
    },
    [tier]
  );

  // All subscribed users can retry quizzes immediately
  const canRetryQuizImmediately = useCallback(() => {
    return tier === 'subscribed';
  }, [tier]);

  const availableFeatures = TIER_FEATURES[tier];

  return {
    subscription,
    tier,
    isActive,
    isPaying,
    isInRecapPeriod,
    recapDaysRemaining,
    hasFeature,
    getFeatureValue,
    canRetryQuizImmediately,
    availableFeatures,
    refreshSubscription: refreshStatus,
  };
}

/**
 * Hook for subscription management actions
 */
export function useSubscriptionActions() {
  const { refreshStatus } = useSubscriptionStore();
  return { refreshSubscription: refreshStatus };
}

export default useSubscription;
