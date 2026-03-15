import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Button } from '@/components/ui/Button';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { useUserStore } from '@/stores/userStore';

const PLAN_FEATURES = [
  'All 180 days of wellness lessons',
  'Daily affirmations & nourishment tips',
  'Personalized movement suggestions',
  'Chapter quizzes with instant retakes',
  'Community circle access',
  'Journal export (PDF)',
  'Offline content access',
  'Milestone celebrations',
  '60-day recap access after completion',
];

export default function OnboardingSubscription() {
  const { 
    refreshStatus, 
    restore, 
    purchaseViaIAP, 
    iapAvailable, 
    iapProduct, 
    isPurchasing 
  } = useSubscriptionStore();
  const { updateOnboardingComplete } = useUserStore();
  const [isRestoring, setIsRestoring] = useState(false);

  // Use product price from StoreKit or fallback
  const displayPrice = iapProduct?.displayPrice || '$19.99';

  const handleSubscribe = async () => {
    if (!iapAvailable) {
      Alert.alert(
        'Not Available', 
        'In-app purchases are not available on this device. Please check your Apple ID settings and try again.'
      );
      return;
    }

    if (!iapProduct) {
      Alert.alert(
        'Not Available', 
        'The subscription product could not be loaded. Please restart the app and try again.'
      );
      return;
    }

    try {
      const success = await purchaseViaIAP();
      if (success) {
        // Purchase initiated - callback will handle completion
        await updateOnboardingComplete();
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      if (error?.code !== 'E_USER_CANCELLED') {
        Alert.alert('Purchase Failed', 'Unable to complete the purchase. Please try again.');
      }
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const hasSubscription = await restore();
      if (hasSubscription) {
        await updateOnboardingComplete();
        router.replace('/(tabs)');
        Alert.alert('Success', 'Your subscription has been restored!');
      } else {
        Alert.alert('No Subscription Found', 'No active subscription was found. If you just completed a purchase, please try again in a few moments.');
      }
    } catch (error) {
      console.error('Restore failed:', error);
      Alert.alert('Error', 'Failed to restore subscription. Please try again.');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleSkip = async () => {
    await updateOnboardingComplete();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
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
          <Text style={styles.title}>Start Your Journey</Text>
          <Text style={styles.subtitle}>
            One simple plan. Everything included. Cancel anytime — or finish all 180 lessons and billing stops automatically.
          </Text>
        </View>

        {/* Plan Card */}
        <View style={styles.planCard}>
          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>{displayPrice}</Text>
            <Text style={styles.pricePeriod}>/month</Text>
          </View>
          <Text style={styles.planName}>Full Access · Cancel anytime</Text>

          <View style={styles.divider} />

          {/* Features */}
          <View style={styles.features}>
            {PLAN_FEATURES.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={18} color={Colors.primary.tiffanyBlue} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* How it works */}
        <View style={styles.howItWorks}>
          <Text style={styles.howItWorksTitle}>How it works</Text>
          <View style={styles.step_item}>
            <Text style={styles.stepNumber}>1</Text>
            <Text style={styles.stepText}>Tap Subscribe — you'll be taken to a secure web checkout</Text>
          </View>
          <View style={styles.step_item}>
            <Text style={styles.stepNumber}>2</Text>
            <Text style={styles.stepText}>Complete payment, then return to the app and tap Restore</Text>
          </View>
          <View style={styles.step_item}>
            <Text style={styles.stepNumber}>3</Text>
            <Text style={styles.stepText}>After all 180 lessons: billing stops, you keep 60 days of access</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <Button
          title={isPurchasing ? 'Processing...' : `Subscribe — ${displayPrice}/mo`}
          onPress={handleSubscribe}
          disabled={isPurchasing || isRestoring || !iapAvailable}
          style={styles.subscribeButton}
        />

        <TouchableOpacity
          onPress={handleRestore}
          disabled={isRestoring || isPurchasing}
          style={styles.restoreButton}
        >
          <Text style={styles.restoreText}>
            {isRestoring ? 'Checking...' : 'Already subscribed? Restore'}
          </Text>
        </TouchableOpacity>

        {Platform.OS === 'ios' && (
          <Text style={styles.appleDisclaimer}>
            Payment will be charged to your Apple ID account at confirmation of purchase. Subscription automatically renews unless auto-renew is turned off at least 24 hours before the end of the current period. Your account will be charged for renewal within 24 hours prior to the end of the current period. You can manage and cancel subscriptions in your Apple ID account settings.
          </Text>
        )}
        
        <Text style={styles.terms}>
          By subscribing, you agree to our{' '}
          <Text
            style={styles.termsLink}
            onPress={() => Linking.openURL('https://www.2equilibrium.com/terms')}
          >
            Terms of Service
          </Text>
          {' '}and{' '}
          <Text
            style={styles.termsLink}
            onPress={() => Linking.openURL('https://www.2equilibrium.com/privacy')}
          >
            Privacy Policy
          </Text>
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
    lineHeight: 22,
  },
  planCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    borderWidth: 2,
    borderColor: Colors.primary.orange,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.xs,
  },
  price: {
    ...Typography.textStyles.h1,
    color: Colors.text.primary,
    fontSize: 42,
  },
  pricePeriod: {
    ...Typography.textStyles.h4,
    color: Colors.text.secondary,
    marginLeft: Spacing.xs,
  },
  planName: {
    ...Typography.textStyles.bodySmall,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.ui?.border || Colors.background.tertiary,
    marginBottom: Spacing.md,
  },
  features: {
    gap: Spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  featureText: {
    ...Typography.textStyles.body,
    color: Colors.text.primary,
    flex: 1,
  },
  howItWorks: {
    backgroundColor: Colors.background.secondary,
    borderRadius: Spacing.borderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  howItWorksTitle: {
    ...Typography.textStyles.h5,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  step_item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary.orange,
    color: Colors.neutral.white,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    fontWeight: '700',
  },
  stepText: {
    ...Typography.textStyles.bodySmall,
    color: Colors.text.secondary,
    flex: 1,
    lineHeight: 20,
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
  appleDisclaimer: {
    ...Typography.textStyles.caption,
    color: Colors.text.muted,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    lineHeight: 16,
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
