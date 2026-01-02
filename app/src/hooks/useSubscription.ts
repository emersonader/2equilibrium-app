import { useCallback, useEffect, useState } from 'react';
import { useUserStore } from '@/stores/userStore';
import * as subscriptionService from '@/services/subscriptionService';
import { TIER_FEATURES, Feature, SubscriptionTier } from '@/constants/featureFlags';

/**
 * Hook for subscription-related functionality
 */
export function useSubscription() {
  const { subscription, refreshSubscription } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);

  // Get current tier
  const tier: SubscriptionTier = subscription?.plan || 'foundation';

  // Check if user has active subscription
  const isActive = subscription?.status === 'active' || subscription?.status === 'trial';

  // Check if user is in trial
  const isInTrial = subscription?.status === 'trial';

  // Get trial days remaining
  const trialDaysRemaining = useCallback(() => {
    if (!subscription?.trial_end_date) return 0;
    const endDate = new Date(subscription.trial_end_date);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }, [subscription?.trial_end_date]);

  // Check if user has a specific feature
  const hasFeature = useCallback(
    (feature: Feature): boolean => {
      const features = TIER_FEATURES[tier];
      const value = features[feature as keyof typeof features];
      return value === true || value === 'full';
    },
    [tier]
  );

  // Get feature value (for features with levels like 'limited', 'full')
  const getFeatureValue = useCallback(
    (feature: Feature): boolean | string => {
      const features = TIER_FEATURES[tier];
      return features[feature as keyof typeof features];
    },
    [tier]
  );

  // Check if user can retry quiz immediately (Lifetime only)
  const canRetryQuizImmediately = useCallback(() => {
    return tier === 'lifetime';
  }, [tier]);

  // Get available features for current tier
  const availableFeatures = TIER_FEATURES[tier];

  return {
    subscription,
    tier,
    isActive,
    isInTrial,
    trialDaysRemaining: trialDaysRemaining(),
    hasFeature,
    getFeatureValue,
    canRetryQuizImmediately,
    availableFeatures,
    refreshSubscription,
    isLoading,
  };
}

/**
 * Hook for subscription management actions
 */
export function useSubscriptionActions() {
  const { refreshSubscription } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a new subscription
  const createSubscription = useCallback(
    async (plan: 'foundation' | 'transformation' | 'lifetime', revenueCatId?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const now = new Date();
        let periodEnd: Date;
        let isTrialPeriod = false;

        // Calculate period based on plan
        switch (plan) {
          case 'foundation':
            periodEnd = new Date(now);
            periodEnd.setMonth(periodEnd.getMonth() + 1);
            break;
          case 'transformation':
            periodEnd = new Date(now);
            periodEnd.setMonth(periodEnd.getMonth() + 6);
            isTrialPeriod = true; // 7-day trial
            break;
          case 'lifetime':
            periodEnd = new Date(now);
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
            break;
        }

        await subscriptionService.createSubscription(
          plan,
          revenueCatId || '',
          now,
          periodEnd,
          isTrialPeriod
        );
        await refreshSubscription();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create subscription');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [refreshSubscription]
  );

  // Convert trial to active
  const convertTrial = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await subscriptionService.convertTrialToActive();
      await refreshSubscription();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert trial');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshSubscription]);

  // Cancel subscription
  const cancelSubscription = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await subscriptionService.cancelSubscription();
      await refreshSubscription();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshSubscription]);

  return {
    createSubscription,
    convertTrial,
    cancelSubscription,
    isLoading,
    error,
  };
}

export default useSubscription;
