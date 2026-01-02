import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Pressable } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
}

export function Card({
  children,
  onPress,
  variant = 'default',
  padding = 'md',
  style,
}: CardProps) {
  const cardStyles = [
    styles.base,
    styles[variant],
    styles[`padding_${padding}`],
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          cardStyles,
          pressed && styles.pressed,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyles}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },

  // Variants
  default: {
    backgroundColor: Colors.background.primary,
    ...Shadows.sm,
  },
  elevated: {
    backgroundColor: Colors.background.primary,
    ...Shadows.lg,
  },
  outlined: {
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },

  // Padding
  padding_none: {
    padding: 0,
  },
  padding_sm: {
    padding: Spacing.sm,
  },
  padding_md: {
    padding: Spacing.base,
  },
  padding_lg: {
    padding: Spacing.xl,
  },
});

export default Card;
