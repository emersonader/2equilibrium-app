import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import type { BadgeWithEarnedStatus, BadgeRarity } from '@/services/database.types';

interface BadgeCardProps {
  badge: BadgeWithEarnedStatus;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
}

// Get color based on rarity
function getRarityColor(rarity: BadgeRarity): string {
  switch (rarity) {
    case 'common':
      return Colors.neutral.gray500;
    case 'rare':
      return Colors.primary.tiffanyBlue;
    case 'epic':
      return Colors.chapter.meal; // Purple
    case 'legendary':
      return Colors.primary.orange;
    default:
      return Colors.neutral.gray500;
  }
}

// Get background color based on rarity
function getRarityBackgroundColor(rarity: BadgeRarity): string {
  switch (rarity) {
    case 'common':
      return Colors.neutral.gray100;
    case 'rare':
      return Colors.primary.tiffanyBlueLight;
    case 'epic':
      return '#F3E8FF'; // Light purple
    case 'legendary':
      return Colors.primary.orangeLight;
    default:
      return Colors.neutral.gray100;
  }
}

// Get icon size based on card size
function getIconSize(size: 'small' | 'medium' | 'large'): number {
  switch (size) {
    case 'small':
      return 24;
    case 'medium':
      return 32;
    case 'large':
      return 48;
  }
}

// Get card dimensions based on size
function getCardDimensions(size: 'small' | 'medium' | 'large'): { width: number; height: number } {
  switch (size) {
    case 'small':
      return { width: 80, height: 90 };
    case 'medium':
      return { width: 100, height: 120 };
    case 'large':
      return { width: 140, height: 160 };
  }
}

export function BadgeCard({
  badge,
  onPress,
  size = 'medium',
  showDetails = true,
}: BadgeCardProps) {
  const rarityColor = getRarityColor(badge.rarity);
  const rarityBgColor = getRarityBackgroundColor(badge.rarity);
  const iconSize = getIconSize(size);
  const dimensions = getCardDimensions(size);

  const content = (
    <View
      style={[
        styles.container,
        {
          width: dimensions.width,
          minHeight: dimensions.height,
          opacity: badge.earned ? 1 : 0.5,
        },
      ]}
    >
      {/* Badge Icon Circle */}
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: badge.earned ? rarityBgColor : Colors.neutral.gray100,
            borderColor: badge.earned ? rarityColor : Colors.neutral.gray300,
            width: iconSize + 24,
            height: iconSize + 24,
          },
        ]}
      >
        <Ionicons
          name={badge.icon_name as any}
          size={iconSize}
          color={badge.earned ? rarityColor : Colors.neutral.gray400}
        />
        {!badge.earned && (
          <View style={styles.lockOverlay}>
            <Ionicons name="lock-closed" size={iconSize * 0.5} color={Colors.neutral.gray400} />
          </View>
        )}
      </View>

      {/* Badge Name */}
      {showDetails && (
        <>
          <Text
            style={[
              styles.name,
              size === 'small' && styles.nameSmall,
              !badge.earned && styles.nameUnearned,
            ]}
            numberOfLines={2}
          >
            {badge.name}
          </Text>

          {/* Rarity Indicator */}
          <View style={[styles.rarityBadge, { backgroundColor: rarityBgColor }]}>
            <Text style={[styles.rarityText, { color: rarityColor }]}>
              {badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1)}
            </Text>
          </View>
        </>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

// Compact badge for lists
export function BadgeCardCompact({
  badge,
  onPress,
}: {
  badge: BadgeWithEarnedStatus;
  onPress?: () => void;
}) {
  const rarityColor = getRarityColor(badge.rarity);

  const content = (
    <View style={[styles.compactContainer, !badge.earned && { opacity: 0.6 }]}>
      <View
        style={[
          styles.compactIcon,
          {
            backgroundColor: badge.earned
              ? getRarityBackgroundColor(badge.rarity)
              : Colors.neutral.gray100,
          },
        ]}
      >
        <Ionicons
          name={badge.icon_name as any}
          size={20}
          color={badge.earned ? rarityColor : Colors.neutral.gray400}
        />
      </View>
      <View style={styles.compactInfo}>
        <Text style={styles.compactName} numberOfLines={1}>
          {badge.name}
        </Text>
        <Text style={styles.compactDescription} numberOfLines={1}>
          {badge.description}
        </Text>
      </View>
      {badge.earned && (
        <Ionicons name="checkmark-circle" size={20} color={Colors.status.success} />
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: Colors.background.primary,
    borderRadius: Spacing.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  iconContainer: {
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: Spacing.xs,
    position: 'relative',
  },
  lockOverlay: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: Colors.background.primary,
    borderRadius: 999,
    padding: 2,
  },
  name: {
    ...Typography.textStyles.bodySmall,
    fontWeight: '600',
    color: Colors.text.primary,
    textAlign: 'center',
    marginTop: Spacing.xxs,
  },
  nameSmall: {
    fontSize: 11,
  },
  nameUnearned: {
    color: Colors.text.muted,
  },
  rarityBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: Spacing.borderRadius.full,
    marginTop: Spacing.xxs,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: Colors.background.primary,
    borderRadius: Spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  compactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  compactInfo: {
    flex: 1,
  },
  compactName: {
    ...Typography.textStyles.bodySmall,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  compactDescription: {
    ...Typography.textStyles.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
});

export default BadgeCard;
