import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';

interface EncourageButtonProps {
  count: number;
  hasEncouraged: boolean;
  onPress: () => Promise<void>;
  disabled?: boolean;
}

export function EncourageButton({
  count,
  hasEncouraged,
  onPress,
  disabled = false,
}: EncourageButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePress = async () => {
    if (isLoading || disabled) return;

    // Animate button press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setIsLoading(true);
    try {
      await onPress();
    } catch (error) {
      console.error('Encourage action failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || isLoading}
      style={styles.container}
      activeOpacity={0.7}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Ionicons
          name={hasEncouraged ? 'heart' : 'heart-outline'}
          size={22}
          color={hasEncouraged ? Colors.status.error : Colors.text.muted}
        />
      </Animated.View>
      {count > 0 && (
        <Text style={[styles.count, hasEncouraged && styles.countActive]}>
          {count}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.xs,
  },
  count: {
    ...Typography.textStyles.bodySmall,
    color: Colors.text.muted,
  },
  countActive: {
    color: Colors.status.error,
  },
});

export default EncourageButton;
