import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Layout } from '@/constants';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${variant}`],
    styles[`text_${size}`],
    isDisabled && styles.textDisabled,
    textStyle,
  ];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={buttonStyles}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? Colors.text.inverse : Colors.primary.orange}
          size="small"
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text style={textStyles}>{title}</Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.base,
    gap: Spacing.sm,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },

  // Variants
  primary: {
    backgroundColor: Colors.primary.orange,
  },
  secondary: {
    backgroundColor: Colors.primary.tiffanyBlue,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary.orange,
  },
  ghost: {
    backgroundColor: 'transparent',
  },

  // Sizes
  size_sm: {
    height: Layout.buttonHeightSmall,
    paddingHorizontal: Spacing.base,
  },
  size_md: {
    height: Layout.buttonHeight,
    paddingHorizontal: Spacing.xl,
  },
  size_lg: {
    height: Layout.buttonHeight + 8,
    paddingHorizontal: Spacing['2xl'],
  },

  // Text styles
  text: {
    ...Typography.button,
  },
  text_primary: {
    color: Colors.text.inverse,
  },
  text_secondary: {
    color: Colors.text.inverse,
  },
  text_outline: {
    color: Colors.primary.orange,
  },
  text_ghost: {
    color: Colors.primary.orange,
  },
  text_sm: {
    ...Typography.buttonSmall,
  },
  text_md: {
    ...Typography.button,
  },
  text_lg: {
    ...Typography.buttonLarge,
  },
  textDisabled: {
    opacity: 0.7,
  },
});

export default Button;
