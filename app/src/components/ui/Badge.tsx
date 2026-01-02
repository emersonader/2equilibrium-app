import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export function Badge({
  label,
  variant = 'primary',
  size = 'md',
  icon,
  style,
}: BadgeProps) {
  return (
    <View style={[styles.base, styles[variant], styles[`size_${size}`], style]}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={[styles.text, styles[`text_${variant}`], styles[`text_${size}`]]}>
        {label}
      </Text>
    </View>
  );
}

// Chapter completion badge
interface ChapterBadgeProps {
  chapterNumber: number;
  title: string;
  completed: boolean;
  style?: ViewStyle;
}

export function ChapterBadge({
  chapterNumber,
  title,
  completed,
  style,
}: ChapterBadgeProps) {
  const chapterColor = getChapterColor(chapterNumber);

  return (
    <View
      style={[
        styles.chapterBadge,
        { borderColor: completed ? chapterColor : Colors.ui.border },
        completed && { backgroundColor: chapterColor + '15' },
        style,
      ]}
    >
      <View
        style={[
          styles.chapterNumber,
          { backgroundColor: completed ? chapterColor : Colors.background.tertiary },
        ]}
      >
        <Text
          style={[
            styles.chapterNumberText,
            { color: completed ? Colors.text.inverse : Colors.text.secondary },
          ]}
        >
          {chapterNumber}
        </Text>
      </View>
      <Text
        style={[
          styles.chapterTitle,
          { color: completed ? chapterColor : Colors.text.secondary },
        ]}
        numberOfLines={1}
      >
        {title}
      </Text>
    </View>
  );
}

function getChapterColor(chapter: number): string {
  const colors = [
    Colors.chapter.awakening,
    Colors.chapter.nourishment,
    Colors.chapter.mindful,
    Colors.chapter.meal,
    Colors.chapter.movement,
    Colors.chapter.mindset,
  ];
  return colors[(chapter - 1) % colors.length];
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  icon: {
    marginRight: Spacing.xs,
  },

  // Variants
  primary: {
    backgroundColor: Colors.primary.orangeLight + '30',
  },
  secondary: {
    backgroundColor: Colors.primary.tiffanyBlueLight + '30',
  },
  success: {
    backgroundColor: Colors.status.successLight,
  },
  warning: {
    backgroundColor: Colors.status.warningLight,
  },
  error: {
    backgroundColor: Colors.status.errorLight,
  },
  info: {
    backgroundColor: Colors.status.infoLight,
  },

  // Sizes
  size_sm: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  size_md: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  size_lg: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },

  // Text styles
  text: {
    ...Typography.caption,
    fontWeight: '600',
  },
  text_primary: {
    color: Colors.primary.orange,
  },
  text_secondary: {
    color: Colors.primary.tiffanyBlue,
  },
  text_success: {
    color: Colors.status.success,
  },
  text_warning: {
    color: Colors.status.warning,
  },
  text_error: {
    color: Colors.status.error,
  },
  text_info: {
    color: Colors.status.info,
  },
  text_sm: {
    fontSize: 10,
  },
  text_md: {
    fontSize: 12,
  },
  text_lg: {
    fontSize: 14,
  },

  // Chapter badge
  chapterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  chapterNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterNumberText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  chapterTitle: {
    ...Typography.bodySmall,
    fontWeight: '500',
  },
});

export default Badge;
