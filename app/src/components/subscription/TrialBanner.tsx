import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';

interface TrialBannerProps {
  daysRemaining: number;
  onUpgrade?: () => void;
}

export function TrialBanner({ daysRemaining, onUpgrade }: TrialBannerProps) {
  const isUrgent = daysRemaining <= 2;

  return (
    <View style={[styles.container, isUrgent && styles.containerUrgent]}>
      <View style={styles.iconContainer}>
        <Ionicons
          name={isUrgent ? 'warning' : 'time-outline'}
          size={24}
          color={isUrgent ? Colors.status.warning : Colors.primary.tiffanyBlue}
        />
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, isUrgent && styles.titleUrgent]}>
          {daysRemaining === 1
            ? 'Last day of trial!'
            : daysRemaining === 0
            ? 'Trial ends today!'
            : `${daysRemaining} days left in trial`}
        </Text>
        <Text style={styles.subtitle}>
          {isUrgent
            ? 'Upgrade now to keep your progress'
            : 'Enjoying your journey? Upgrade anytime'}
        </Text>
      </View>

      {onUpgrade && (
        <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
          <Text style={styles.upgradeText}>Upgrade</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary.tiffanyBlueLight,
    padding: Spacing.md,
    borderRadius: Spacing.borderRadius.md,
    marginBottom: Spacing.md,
  },
  containerUrgent: {
    backgroundColor: Colors.status.warningLight,
  },
  iconContainer: {
    marginRight: Spacing.sm,
  },
  content: {
    flex: 1,
  },
  title: {
    ...Typography.textStyles.body,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  titleUrgent: {
    color: Colors.status.warning,
  },
  subtitle: {
    ...Typography.textStyles.caption,
    color: Colors.text.secondary,
  },
  upgradeButton: {
    backgroundColor: Colors.primary.orange,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Spacing.borderRadius.full,
  },
  upgradeText: {
    ...Typography.textStyles.caption,
    color: Colors.neutral.white,
    fontWeight: '600',
  },
});

export default TrialBanner;
