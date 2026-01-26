import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Button } from '@/components/ui/Button';
import { TierCard } from '@/components/subscription/TierCard';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { useUserStore } from '@/stores/userStore';
import type { SubscriptionPlan } from '@/services/database.types';

export default function OnboardingSubscription() {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('transformation');
  const { packages, isLoading, purchase, loadPackages } = useSubscriptionStore();
  const { updateOnboardingComplete } = useUserStore();
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    loadPackages();
  }, []);

  const handleSubscribe = async () => {
    setIsPurchasing(true);
    try {
      // Find the package for the selected plan
      const pkg = packages.find((p) => {
        if (selectedPlan === 'foundation') return p.packageType === 'MONTHLY';
        if (selectedPlan === 'transformation') return p.packageType === 'SIX_MONTH';
        if (selectedPlan === 'lifetime') return p.packageType === 'ANNUAL';
        return false;
      });

      if (pkg) {
        const success = await purchase(pkg);
        if (success) {
          await updateOnboardingComplete();
          router.replace('/(tabs)');
        }
      } else {
        // If no packages (development mode), just complete onboarding
        await updateOnboardingComplete();
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Purchase failed:', error);
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsPurchasing(true);
    try {
      const { restore } = useSubscriptionStore.getState();
      const hasSubscription = await restore();
      if (hasSubscription) {
        await updateOnboardingComplete();
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Restore failed:', error);
    } finally {
      setIsPurchasing(false);
    }
  };

  const getButtonText = () => {
    if (selectedPlan === 'transformation') {
      return 'Start Free Trial';
    }
    return 'Subscribe Now';
  };

  const handleSkip = async () => {
    // Allow skipping subscription during development/testing
    await updateOnboardingComplete();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Progress */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: '100%' }]} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.step}>Step 4 of 4</Text>
          <Text style={styles.title}>Choose Your Path</Text>
          <Text style={styles.subtitle}>
            Select the plan that fits your wellness journey. You can change anytime.
          </Text>
        </View>

        {/* Plans */}
        <View style={styles.plans}>
          <TierCard
            plan="foundation"
            isSelected={selectedPlan === 'foundation'}
            onSelect={() => setSelectedPlan('foundation')}
          />
          <TierCard
            plan="transformation"
            isSelected={selectedPlan === 'transformation'}
            isRecommended
            onSelect={() => setSelectedPlan('transformation')}
          />
          <TierCard
            plan="lifetime"
            isSelected={selectedPlan === 'lifetime'}
            onSelect={() => setSelectedPlan('lifetime')}
          />
        </View>

        {/* Money-back guarantee */}
        <View style={styles.guarantee}>
          <Ionicons name="shield-checkmark" size={20} color={Colors.status.success} />
          <Text style={styles.guaranteeText}>
            30-day money-back guarantee. No questions asked.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <Button
          title={isPurchasing ? 'Processing...' : getButtonText()}
          onPress={handleSubscribe}
          disabled={isPurchasing}
          style={styles.subscribeButton}
        />

        <TouchableOpacity
          onPress={handleRestore}
          disabled={isPurchasing}
          style={styles.restoreButton}
        >
          <Text style={styles.restoreText}>Restore Purchases</Text>
        </TouchableOpacity>

        <Text style={styles.terms}>
          By subscribing, you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.layout.screenPadding,
    paddingVertical: Spacing.sm,
  },
  backButton: {
    padding: Spacing.xs,
  },
  skipButton: {
    padding: Spacing.xs,
  },
  skipText: {
    ...Typography.textStyles.body,
    color: Colors.text.secondary,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.background.tertiary,
    marginHorizontal: Spacing.layout.screenPadding,
    borderRadius: Spacing.borderRadius.full,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary.orange,
    borderRadius: Spacing.borderRadius.full,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.layout.screenPadding,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  step: {
    ...Typography.textStyles.caption,
    color: Colors.primary.orange,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  title: {
    ...Typography.textStyles.h2,
    color: Colors.text.primary,
  },
  subtitle: {
    ...Typography.textStyles.body,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  plans: {
    marginBottom: Spacing.lg,
  },
  guarantee: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.status.successLight,
    padding: Spacing.md,
    borderRadius: Spacing.borderRadius.md,
  },
  guaranteeText: {
    ...Typography.textStyles.bodySmall,
    color: Colors.text.primary,
    marginLeft: Spacing.xs,
  },
  bottomActions: {
    padding: Spacing.layout.screenPadding,
    borderTopWidth: 1,
    borderTopColor: Colors.background.tertiary,
  },
  subscribeButton: {
    marginBottom: Spacing.sm,
  },
  restoreButton: {
    alignItems: 'center',
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  restoreText: {
    ...Typography.textStyles.body,
    color: Colors.primary.orange,
  },
  terms: {
    ...Typography.textStyles.caption,
    color: Colors.text.muted,
    textAlign: 'center',
  },
  termsLink: {
    color: Colors.text.secondary,
    textDecorationLine: 'underline',
  },
});
