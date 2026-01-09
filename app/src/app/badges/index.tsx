import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Card } from '@/components/ui';
import { BadgeGrid } from '@/components/badges';
import { useBadgeStore } from '@/stores';
import type { BadgeWithEarnedStatus } from '@/services/database.types';

export default function BadgesScreen() {
  const router = useRouter();
  const {
    badges,
    stats,
    isLoading,
    loadBadges,
    loadStats,
  } = useBadgeStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBadges();
    loadStats();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadBadges(), loadStats()]);
    setRefreshing(false);
  };

  const handleBadgePress = (badge: BadgeWithEarnedStatus) => {
    router.push(`/badges/${badge.id}`);
  };

  // Calculate progress percentage
  const progressPercent = stats.totalAvailable > 0
    ? Math.round((stats.totalBadges / stats.totalAvailable) * 100)
    : 0;

  if (isLoading && badges.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.orange} />
          <Text style={styles.loadingText}>Loading badges...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Badge Collection</Text>
          <Text style={styles.subtitle}>
            Track your achievements on your wellness journey
          </Text>
        </View>

        {/* Stats Card */}
        <Card variant="elevated" style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalBadges}</Text>
              <Text style={styles.statLabel}>Earned</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalAvailable}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{progressPercent}%</Text>
              <Text style={styles.statLabel}>Complete</Text>
            </View>
          </View>

          {/* Rarity breakdown */}
          <View style={styles.rarityRow}>
            <View style={styles.rarityItem}>
              <View style={[styles.rarityDot, { backgroundColor: Colors.neutral.gray500 }]} />
              <Text style={styles.rarityText}>{stats.commonBadges} Common</Text>
            </View>
            <View style={styles.rarityItem}>
              <View style={[styles.rarityDot, { backgroundColor: Colors.primary.tiffanyBlue }]} />
              <Text style={styles.rarityText}>{stats.rareBadges} Rare</Text>
            </View>
            <View style={styles.rarityItem}>
              <View style={[styles.rarityDot, { backgroundColor: Colors.chapter.meal }]} />
              <Text style={styles.rarityText}>{stats.epicBadges} Epic</Text>
            </View>
            <View style={styles.rarityItem}>
              <View style={[styles.rarityDot, { backgroundColor: Colors.primary.orange }]} />
              <Text style={styles.rarityText}>{stats.legendaryBadges} Legendary</Text>
            </View>
          </View>
        </Card>

        {/* Badge Grid by Category */}
        <BadgeGrid
          badges={badges}
          onBadgePress={handleBadgePress}
          showCategory
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
  loadingText: {
    ...Typography.textStyles.body,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.layout.screenPadding,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.textStyles.h2,
    color: Colors.text.primary,
  },
  subtitle: {
    ...Typography.textStyles.body,
    color: Colors.text.secondary,
    marginTop: Spacing.xxs,
  },
  statsCard: {
    marginBottom: Spacing.xl,
    padding: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    ...Typography.textStyles.h2,
    color: Colors.primary.orange,
  },
  statLabel: {
    ...Typography.textStyles.caption,
    color: Colors.text.secondary,
    marginTop: Spacing.xxs,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.ui.border,
  },
  rarityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.ui.border,
  },
  rarityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rarityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xxs,
  },
  rarityText: {
    ...Typography.textStyles.caption,
    color: Colors.text.secondary,
  },
});
