import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Card } from '@/components/ui/Card';
import { STRIPE_CHECKOUT_URL } from '@/constants/featureFlags';

const PLAN_FEATURES = [
  'All 180 days of wellness lessons',
  'Daily affirmations & nourishment tips',
  'Personalized movement suggestions',
  'Chapter quizzes with instant retakes',
  'Community circle access',
  'Journal export (PDF)',
  'Offline content access',
  '60-day recap access after completion',
];

interface PlanCardProps {
  onPress?: () => void;
}

/**
 * PlanCard — displays the single 2Equilibrium Premium plan.
 * Subscription is purchased on the web via Stripe.
 */
export function TierCard({ onPress }: PlanCardProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      Linking.openURL(STRIPE_CHECKOUT_URL);
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <Card style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Premium</Text>
            <Text style={styles.duration}>Monthly · Cancel anytime</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>FULL ACCESS</Text>
          </View>
        </View>

        {/* Pricing */}
        <View style={styles.pricing}>
          <Text style={styles.price}>$19.99</Text>
          <Text style={styles.perMonth}>/month</Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          {PLAN_FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.primary.tiffanyBlue} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.primary.orange,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.textStyles.h4,
    color: Colors.text.primary,
  },
  duration: {
    ...Typography.textStyles.caption,
    color: Colors.text.secondary,
  },
  badge: {
    backgroundColor: Colors.primary.orangeLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: Spacing.borderRadius.full,
  },
  badgeText: {
    ...Typography.textStyles.caption,
    color: Colors.primary.orange,
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  pricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.md,
  },
  price: {
    ...Typography.textStyles.h2,
    color: Colors.text.primary,
  },
  perMonth: {
    ...Typography.textStyles.body,
    color: Colors.text.secondary,
    marginLeft: Spacing.xs,
  },
  features: {
    gap: Spacing.xs,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    ...Typography.textStyles.bodySmall,
    color: Colors.text.secondary,
    marginLeft: Spacing.xs,
    flex: 1,
  },
});

export default TierCard;
