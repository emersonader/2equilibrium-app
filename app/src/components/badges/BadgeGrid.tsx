import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { BadgeCard, BadgeCardCompact } from './BadgeCard';
import type { BadgeWithEarnedStatus, BadgeCategory } from '@/services/database.types';

interface BadgeGridProps {
  badges: BadgeWithEarnedStatus[];
  onBadgePress?: (badge: BadgeWithEarnedStatus) => void;
  columns?: 3 | 4;
  showCategory?: boolean;
  emptyMessage?: string;
}

interface BadgeSectionProps {
  title: string;
  badges: BadgeWithEarnedStatus[];
  onBadgePress?: (badge: BadgeWithEarnedStatus) => void;
}

// Get category display name
function getCategoryName(category: BadgeCategory): string {
  switch (category) {
    case 'streak':
      return 'Streak Badges';
    case 'chapter':
      return 'Chapter Badges';
    case 'milestone':
      return 'Milestone Badges';
    case 'special':
      return 'Special Badges';
    default:
      return 'Badges';
  }
}

// Badge grid component
export function BadgeGrid({
  badges,
  onBadgePress,
  columns = 3,
  showCategory = false,
  emptyMessage = 'No badges yet',
}: BadgeGridProps) {
  if (badges.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  if (showCategory) {
    // Group by category
    const grouped = badges.reduce((acc, badge) => {
      const key = badge.category;
      if (!acc[key]) acc[key] = [];
      acc[key].push(badge);
      return acc;
    }, {} as Record<BadgeCategory, BadgeWithEarnedStatus[]>);

    const categories: BadgeCategory[] = ['streak', 'chapter', 'milestone', 'special'];

    return (
      <View style={styles.container}>
        {categories.map(category => {
          const categoryBadges = grouped[category];
          if (!categoryBadges || categoryBadges.length === 0) return null;

          return (
            <BadgeSection
              key={category}
              title={getCategoryName(category)}
              badges={categoryBadges}
              onBadgePress={onBadgePress}
            />
          );
        })}
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {badges.map(badge => (
        <View
          key={badge.id}
          style={[styles.gridItem, { width: `${100 / columns}%` }]}
        >
          <BadgeCard
            badge={badge}
            onPress={onBadgePress ? () => onBadgePress(badge) : undefined}
            size="small"
          />
        </View>
      ))}
    </View>
  );
}

// Badge section with title
export function BadgeSection({ title, badges, onBadgePress }: BadgeSectionProps) {
  const earnedCount = badges.filter(b => b.earned).length;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionCount}>
          {earnedCount}/{badges.length}
        </Text>
      </View>
      <View style={styles.grid}>
        {badges.map(badge => (
          <View key={badge.id} style={[styles.gridItem, { width: '33.33%' }]}>
            <BadgeCard
              badge={badge}
              onPress={onBadgePress ? () => onBadgePress(badge) : undefined}
              size="small"
            />
          </View>
        ))}
      </View>
    </View>
  );
}

// Horizontal scrolling badge list
export function BadgeList({
  badges,
  onBadgePress,
  title,
}: {
  badges: BadgeWithEarnedStatus[];
  onBadgePress?: (badge: BadgeWithEarnedStatus) => void;
  title?: string;
}) {
  if (badges.length === 0) return null;

  return (
    <View>
      {title && (
        <Text style={styles.listTitle}>{title}</Text>
      )}
      <FlatList
        data={badges}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <BadgeCard
              badge={item}
              onPress={onBadgePress ? () => onBadgePress(item) : undefined}
              size="medium"
            />
          </View>
        )}
      />
    </View>
  );
}

// Compact vertical list
export function BadgeListCompact({
  badges,
  onBadgePress,
}: {
  badges: BadgeWithEarnedStatus[];
  onBadgePress?: (badge: BadgeWithEarnedStatus) => void;
}) {
  return (
    <View style={styles.compactList}>
      {badges.map(badge => (
        <View key={badge.id} style={styles.compactItem}>
          <BadgeCardCompact
            badge={badge}
            onPress={onBadgePress ? () => onBadgePress(badge) : undefined}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.textStyles.body,
    color: Colors.text.muted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xxs,
  },
  gridItem: {
    padding: Spacing.xxs,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.textStyles.h5,
    color: Colors.text.primary,
  },
  sectionCount: {
    ...Typography.textStyles.bodySmall,
    color: Colors.text.secondary,
  },
  listTitle: {
    ...Typography.textStyles.h5,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  listContent: {
    paddingHorizontal: Spacing.xs,
  },
  listItem: {
    marginRight: Spacing.sm,
  },
  compactList: {
    gap: Spacing.xs,
  },
  compactItem: {
    // No additional styling needed
  },
});

export default BadgeGrid;
