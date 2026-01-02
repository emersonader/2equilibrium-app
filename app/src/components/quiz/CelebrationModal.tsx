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
import { ChapterBadge } from '@/components/ui/Badge';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CelebrationModalProps {
  visible: boolean;
  chapterNumber: number;
  chapterTitle: string;
  score: number;
  onContinue: () => void;
  onShare?: () => void;
}

// Simple confetti particle
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

export function CelebrationModal({
  visible,
  chapterNumber,
  chapterTitle,
  score,
  onContinue,
  onShare,
}: CelebrationModalProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
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
    } else {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const confettiColors = [
    Colors.primary.orange,
    Colors.primary.tiffanyBlue,
    Colors.chapter.awakening,
    Colors.chapter.nourishment,
    Colors.chapter.mindful,
    Colors.chapter.meal,
  ];

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
          {/* Badge */}
          <View style={styles.badgeContainer}>
            <ChapterBadge chapterNumber={chapterNumber} title={chapterTitle} completed />
          </View>

          {/* Title */}
          <Text style={styles.title}>Chapter Complete!</Text>
          <Text style={styles.chapterTitle}>{chapterTitle}</Text>

          {/* Score */}
          <View style={styles.scoreContainer}>
            <Ionicons name="star" size={24} color={Colors.primary.orange} />
            <Text style={styles.scoreText}>{score}%</Text>
          </View>

          {/* Message */}
          <Text style={styles.message}>
            You've demonstrated a solid understanding of the concepts. Your badge has been
            earned!
          </Text>

          {/* Actions */}
          <View style={styles.actions}>
            <Button title="Continue Journey" onPress={onContinue} style={styles.button} />
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
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.textStyles.h3,
    color: Colors.text.primary,
  },
  chapterTitle: {
    ...Typography.textStyles.body,
    color: Colors.text.secondary,
    marginTop: Spacing.xxs,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  scoreText: {
    ...Typography.textStyles.h2,
    color: Colors.primary.orange,
    marginLeft: Spacing.xs,
  },
  message: {
    ...Typography.textStyles.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  actions: {
    width: '100%',
    gap: Spacing.sm,
  },
  button: {
    width: '100%',
  },
});

export default CelebrationModal;
