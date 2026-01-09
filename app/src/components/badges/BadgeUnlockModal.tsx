import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Button } from '@/components/ui/Button';
import type { Badge, BadgeRarity } from '@/services/database.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface BadgeUnlockModalProps {
  visible: boolean;
  badge: Badge | null;
  onDismiss: () => void;
  onShare?: () => void;
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

// Get background gradient colors based on rarity
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

// Get rarity message
function getRarityMessage(rarity: BadgeRarity): string {
  switch (rarity) {
    case 'common':
      return 'A stepping stone on your wellness journey!';
    case 'rare':
      return 'An impressive achievement on your path!';
    case 'epic':
      return 'A remarkable milestone of dedication!';
    case 'legendary':
      return 'An extraordinary accomplishment! You are truly committed!';
    default:
      return 'Congratulations on your achievement!';
  }
}

// Confetti particle
function ConfettiParticle({ delay, color }: { delay: number; color: string }) {
  const translateY = useRef(new Animated.Value(-50)).current;
  const translateX = useRef(new Animated.Value(Math.random() * SCREEN_WIDTH)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 600,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: (translateX as any)._value + (Math.random() - 0.5) * 100,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: Math.random() * 10,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(2000),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]);

    animation.start();
  }, []);

  const rotateInterpolate = rotate.interpolate({
    inputRange: [0, 10],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          backgroundColor: color,
          transform: [
            { translateY },
            { translateX },
            { rotate: rotateInterpolate },
          ],
          opacity,
        },
      ]}
    />
  );
}

export function BadgeUnlockModal({
  visible,
  badge,
  onDismiss,
  onShare,
}: BadgeUnlockModalProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const badgeScaleAnim = useRef(new Animated.Value(0.5)).current;
  const badgeRotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && badge) {
      // Reset animations
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      badgeScaleAnim.setValue(0.5);
      badgeRotateAnim.setValue(0);

      // Start animations
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Badge entrance animation
      Animated.sequence([
        Animated.delay(200),
        Animated.parallel([
          Animated.spring(badgeScaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 5,
            useNativeDriver: true,
          }),
          Animated.timing(badgeRotateAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [visible, badge]);

  if (!badge) return null;

  const rarityColor = getRarityColor(badge.rarity);
  const rarityBgColor = getRarityBackgroundColor(badge.rarity);
  const message = getRarityMessage(badge.rarity);

  const confettiColors = [
    Colors.primary.orange,
    Colors.primary.tiffanyBlue,
    Colors.chapter.awakening,
    Colors.chapter.nourishment,
    rarityColor,
  ];

  const badgeRotateInterpolate = badgeRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-10deg', '0deg'],
  });

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        {/* Confetti */}
        {visible &&
          Array.from({ length: 30 }).map((_, index) => (
            <ConfettiParticle
              key={index}
              delay={index * 50}
              color={confettiColors[index % confettiColors.length]}
            />
          ))}

        <Animated.View
          style={[
            styles.content,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Badge Icon */}
          <Animated.View
            style={[
              styles.badgeContainer,
              {
                backgroundColor: rarityBgColor,
                borderColor: rarityColor,
                transform: [
                  { scale: badgeScaleAnim },
                  { rotate: badgeRotateInterpolate },
                ],
              },
            ]}
          >
            <Ionicons
              name={badge.icon_name as any}
              size={64}
              color={rarityColor}
            />
          </Animated.View>

          {/* Rarity Badge */}
          <View style={[styles.rarityBadge, { backgroundColor: rarityBgColor }]}>
            <Text style={[styles.rarityText, { color: rarityColor }]}>
              {badge.rarity.toUpperCase()}
            </Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>Badge Unlocked!</Text>
          <Text style={styles.badgeName}>{badge.name}</Text>

          {/* Description */}
          <Text style={styles.description}>{badge.description}</Text>

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              title="Awesome!"
              onPress={onDismiss}
              style={styles.button}
            />
            {onShare && (
              <Button
                title="Share Achievement"
                variant="outline"
                onPress={onShare}
                style={styles.button}
              />
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.layout.screenPadding,
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  content: {
    backgroundColor: Colors.background.primary,
    borderRadius: Spacing.borderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  badgeContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    marginBottom: Spacing.md,
  },
  rarityBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Spacing.borderRadius.full,
    marginBottom: Spacing.md,
  },
  rarityText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    ...Typography.textStyles.h3,
    color: Colors.text.primary,
  },
  badgeName: {
    ...Typography.textStyles.h4,
    color: Colors.primary.orange,
    marginTop: Spacing.xxs,
  },
  description: {
    ...Typography.textStyles.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  message: {
    ...Typography.textStyles.bodySmall,
    color: Colors.text.muted,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  actions: {
    width: '100%',
    gap: Spacing.sm,
  },
  button: {
    width: '100%',
  },
});

export default BadgeUnlockModal;
