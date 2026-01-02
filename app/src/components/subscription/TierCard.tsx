import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Card } from '@/components/ui/Card';
import { SUBSCRIPTION_PRICING } from '@/constants/featureFlags';
import type { SubscriptionPlan } from '@/services/database.types';

interface TierCardProps {
  plan: SubscriptionPlan;
  isSelected?: boolean;
  isRecommended?: boolean;
  onSelect: () => void;
  actualPrice?: string; // From RevenueCat
}

const PLAN_DETAILS: Record<
  SubscriptionPlan,
  {
    title: string;
    duration: string;
    features: string[];
    trialText?: string;
  }
> = {
  foundation: {
    title: 'Foundation',
    duration: 'Monthly',
    features: [
      'Daily lesson unlocks',
      'Daily reflection prompts',
      'Basic movement suggestions',
      'Current lesson offline',
    ],
  },
  transformation: {
    title: 'Transformation',
    duration: '6 Months',
    trialText: '1 Week Free Trial',
    features: [
      'Everything in Foundation',
      'Daily affirmations',
      'Personalized movement',
      'Full chapter offline',
      'Weekly mood insights',
      'Journal export (PDF)',
    ],
  },
  lifetime: {
    title: 'Lifetime Wellness',
    duration: '12 Months',
    features: [
      'Everything in Transformation',
      'Unlimited quiz retakes',
      'Full phase offline',
      'Priority community access',
      'Video movement library',
      'Advanced analytics',
    ],
  },
};

export function TierCard({
  plan,
  isSelected = false,
  isRecommended = false,
  onSelect,
  actualPrice,
}: TierCardProps) {
  const details = PLAN_DETAILS[plan];
  const pricing = SUBSCRIPTION_PRICING[plan];

  return (
    <TouchableOpacity onPress={onSelect} activeOpacity={0.8}>
      <Card
        style={[
          styles.container,
          isSelected ? styles.containerSelected : undefined,
          isRecommended ? styles.containerRecommended : undefined,
        ]}
      >
        {/* Recommended Badge */}
        {isRecommended && (
          <View style={styles.recommendedBadge}>
            <Text style={styles.recommendedText}>RECOMMENDED</Text>
          </View>
        )}

        {/* Trial Badge */}
        {details.trialText && (
          <View style={styles.trialBadge}>
            <Ionicons name="gift" size={12} color={Colors.primary.tiffanyBlue} />
            <Text style={styles.trialText}>{details.trialText}</Text>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{details.title}</Text>
            <Text style={styles.duration}>{details.duration}</Text>
          </View>

          {/* Selection Indicator */}
          <View style={[styles.radio, isSelected && styles.radioSelected]}>
            {isSelected && (
              <Ionicons name="checkmark" size={16} color={Colors.neutral.white} />
            )}
          </View>
        </View>

        {/* Pricing */}
        <View style={styles.pricing}>
          <Text style={styles.price}>{actualPrice || pricing.price}</Text>
          {pricing.perMonth && (
            <Text style={styles.perMonth}>
              {pricing.perMonth}/mo
            </Text>
          )}
        </View>

        {/* Features */}
        <View style={styles.features}>
          {details.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={isSelected ? Colors.primary.orange : Colors.status.success}
              />
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
    borderColor: 'transparent',
  },
  containerSelected: {
    borderColor: Colors.primary.orange,
    backgroundColor: Colors.primary.orangeLight,
  },
  containerRecommended: {
    borderColor: Colors.primary.tiffanyBlue,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -10,
    right: Spacing.md,
    backgroundColor: Colors.primary.tiffanyBlue,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: Spacing.borderRadius.full,
  },
  recommendedText: {
    ...Typography.textStyles.caption,
    color: Colors.neutral.white,
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  trialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary.tiffanyBlueLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: Spacing.borderRadius.full,
    marginBottom: Spacing.sm,
  },
  trialText: {
    ...Typography.textStyles.caption,
    color: Colors.primary.tiffanyBlue,
    fontWeight: '600',
    marginLeft: Spacing.xxs,
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
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.text.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: Colors.primary.orange,
    backgroundColor: Colors.primary.orange,
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
  },
});

export default TierCard;
