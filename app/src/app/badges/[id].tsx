import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Card, Button } from '@/components/ui';
import { getBadgeById, hasBadge } from '@/services/badgeService';
import type { Badge, BadgeRarity } from '@/services/database.types';

// Get color based on rarity
function getRarityColor(rarity: BadgeRarity): string {
  switch (rarity) {
    case 'common':
      return Colors.neutral.gray500;
    case 'rare':
      return Colors.primary.tiffanyBlue;
    case 'epic':
      return Colors.chapter.meal;
    case 'legendary':
      return Colors.primary.orange;
    default:
      return Colors.neutral.gray500;
  }
}

function getRarityBackgroundColor(rarity: BadgeRarity): string {
  switch (rarity) {
    case 'common':
      return Colors.neutral.gray100;
    case 'rare':
      return Colors.primary.tiffanyBlueLight;
    case 'epic':
      return '#F3E8FF';
    case 'legendary':
      return Colors.primary.orangeLight;
    default:
      return Colors.neutral.gray100;
  }
}

// Get hint for how to earn the badge
function getEarnHint(badgeId: string): string {
  if (badgeId.startsWith('streak_')) {
    const days = badgeId.replace('streak_', '');
    return `Complete lessons for ${days} consecutive days to earn this badge.`;
  }
  if (badgeId.startsWith('chapter_')) {
    const chapter = badgeId.replace('chapter_', '');
    return `Complete all lessons and pass the quiz for Chapter ${chapter}.`;
  }
  if (badgeId === 'first_lesson') {
    return 'Complete your very first lesson to earn this badge.';
  }
  if (badgeId === 'phase_1') {
    return 'Complete all 30 days of Phase 1 to earn this legendary badge.';
  }
  if (badgeId === 'first_journal') {
    return 'Write your first journal entry to earn this badge.';
  }
  if (badgeId.startsWith('journal_')) {
    const count = badgeId.replace('journal_', '');
    return `Write ${count} journal entries to earn this badge.`;
  }
  if (badgeId === 'quiz_perfect') {
    return 'Score 100% on any chapter quiz to earn this badge.';
  }
  if (badgeId === 'early_bird') {
    return 'Complete a lesson before 8am to earn this badge.';
  }
  if (badgeId === 'night_owl') {
    return 'Complete a lesson after 10pm to earn this badge.';
  }
  if (badgeId === 'weekend_warrior') {
    return 'Complete lessons on both Saturday and Sunday in the same weekend.';
  }
  if (badgeId === 'comeback') {
    return 'Return after 7+ days away and complete a lesson.';
  }
  return 'Keep progressing on your wellness journey to unlock this badge.';
}

export default function BadgeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [badge, setBadge] = useState<Badge | null>(null);
  const [earned, setEarned] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBadge();
  }, [id]);

  const loadBadge = async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const [badgeData, earnedStatus] = await Promise.all([
        getBadgeById(id),
        hasBadge(id),
      ]);
      setBadge(badgeData);
      setEarned(earnedStatus);
    } catch (error) {
      console.error('Failed to load badge:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Badge Details' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.orange} />
        </View>
      </SafeAreaView>
    );
  }

  if (!badge) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Badge Details' }} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.text.muted} />
          <Text style={styles.errorText}>Badge not found</Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const rarityColor = getRarityColor(badge.rarity);
  const rarityBgColor = getRarityBackgroundColor(badge.rarity);
  const earnHint = getEarnHint(badge.id);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          title: badge.name,
          headerBackTitle: 'Badges',
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Badge Display */}
        <View style={styles.badgeSection}>
          <View
            style={[
              styles.badgeIconContainer,
              {
                backgroundColor: earned ? rarityBgColor : Colors.neutral.gray100,
                borderColor: earned ? rarityColor : Colors.neutral.gray300,
                opacity: earned ? 1 : 0.6,
              },
            ]}
          >
            <Ionicons
              name={badge.icon_name as any}
              size={72}
              color={earned ? rarityColor : Colors.neutral.gray400}
            />
            {!earned && (
              <View style={styles.lockOverlay}>
                <Ionicons name="lock-closed" size={24} color={Colors.neutral.gray400} />
              </View>
            )}
          </View>

          {/* Rarity Badge */}
          <View style={[styles.rarityBadge, { backgroundColor: rarityBgColor }]}>
            <Text style={[styles.rarityText, { color: rarityColor }]}>
              {badge.rarity.toUpperCase()}
            </Text>
          </View>

          {/* Badge Name */}
          <Text style={styles.badgeName}>{badge.name}</Text>

          {/* Status */}
          <View style={styles.statusContainer}>
            {earned ? (
              <>
                <Ionicons name="checkmark-circle" size={20} color={Colors.status.success} />
                <Text style={styles.statusTextEarned}>Earned</Text>
              </>
            ) : (
              <>
                <Ionicons name="time-outline" size={20} color={Colors.text.muted} />
                <Text style={styles.statusTextLocked}>Not Yet Earned</Text>
              </>
            )}
          </View>
        </View>

        {/* Description Card */}
        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>About This Badge</Text>
          <Text style={styles.description}>{badge.description}</Text>
        </Card>

        {/* How to Earn Card */}
        {!earned && (
          <Card style={styles.infoCard}>
            <Text style={styles.sectionTitle}>How to Earn</Text>
            <Text style={styles.hintText}>{earnHint}</Text>
          </Card>
        )}

        {/* Category Info */}
        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.categoryRow}>
            <View style={styles.categoryItem}>
              <Text style={styles.categoryLabel}>Type</Text>
              <Text style={styles.categoryValue}>
                {badge.category.charAt(0).toUpperCase() + badge.category.slice(1)}
              </Text>
            </View>
            <View style={styles.categoryItem}>
              <Text style={styles.categoryLabel}>Rarity</Text>
              <Text style={[styles.categoryValue, { color: rarityColor }]}>
                {badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Back Button */}
        <Button
          title="Back to Collection"
          variant="outline"
          onPress={() => router.back()}
          style={styles.backButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    ...Typography.textStyles.body,
    color: Colors.text.muted,
    marginVertical: Spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.layout.screenPadding,
    paddingBottom: Spacing.xxxl,
  },
  badgeSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  badgeIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    position: 'relative',
  },
  lockOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.background.primary,
    borderRadius: 999,
    padding: 4,
  },
  rarityBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Spacing.borderRadius.full,
    marginTop: Spacing.md,
  },
  rarityText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  badgeName: {
    ...Typography.textStyles.h2,
    color: Colors.text.primary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  statusTextEarned: {
    ...Typography.textStyles.body,
    color: Colors.status.success,
    marginLeft: Spacing.xs,
    fontWeight: '600',
  },
  statusTextLocked: {
    ...Typography.textStyles.body,
    color: Colors.text.muted,
    marginLeft: Spacing.xs,
  },
  infoCard: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.textStyles.h5,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  description: {
    ...Typography.textStyles.body,
    color: Colors.text.secondary,
    lineHeight: 24,
  },
  hintText: {
    ...Typography.textStyles.body,
    color: Colors.text.secondary,
    lineHeight: 24,
  },
  categoryRow: {
    flexDirection: 'row',
  },
  categoryItem: {
    flex: 1,
  },
  categoryLabel: {
    ...Typography.textStyles.caption,
    color: Colors.text.muted,
    marginBottom: Spacing.xxs,
  },
  categoryValue: {
    ...Typography.textStyles.body,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  backButton: {
    marginTop: Spacing.lg,
  },
});
