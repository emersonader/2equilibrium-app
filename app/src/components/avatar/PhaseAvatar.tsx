import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { getAvatarById, DEFAULT_AVATAR_ID } from '@/constants/avatars';

// ─── Phase config ─────────────────────────────────────────────────────────────

interface PhaseConfig {
  /** Glow / ring color */
  ringColor: string;
  /** Optional second ring color for multi-ring phases */
  ringColor2?: string;
  /** Whether to show the pulse animation */
  pulse: boolean;
  /** Ring width */
  ringWidth: number;
  /** Shadow opacity (0 = no glow) */
  glowOpacity: number;
}

const PHASE_CONFIG: Record<number, PhaseConfig> = {
  1: {
    ringColor: Colors.neutral.gray300,
    pulse: false,
    ringWidth: 2,
    glowOpacity: 0,
  },
  2: {
    ringColor: '#3498DB',
    pulse: true,
    ringWidth: 3,
    glowOpacity: 0.4,
  },
  3: {
    ringColor: Colors.primary.tiffanyBlue,
    pulse: true,
    ringWidth: 3,
    glowOpacity: 0.5,
  },
  4: {
    ringColor: '#9B59B6',
    pulse: true,
    ringWidth: 3,
    glowOpacity: 0.55,
  },
  5: {
    ringColor: '#F39C12',
    pulse: true,
    ringWidth: 4,
    glowOpacity: 0.6,
  },
  6: {
    ringColor: '#E67E22',
    ringColor2: '#0ABAB5',
    pulse: true,
    ringWidth: 4,
    glowOpacity: 0.7,
  },
};

function getPhaseConfig(phase: number): PhaseConfig {
  const clamped = Math.max(1, Math.min(6, phase));
  return PHASE_CONFIG[clamped] ?? PHASE_CONFIG[1];
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface PhaseAvatarProps {
  /** Avatar character ID (1-56) */
  avatarId?: number;
  /** Phase 1–6 (derived from completedLessons / 30) */
  phase: number;
  /** Avatar diameter in pixels (default 64) */
  size?: number;
  /** Optional onPress handler */
  onPress?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PhaseAvatar({
  avatarId,
  phase,
  size = 64,
  onPress,
}: PhaseAvatarProps) {
  const config = getPhaseConfig(phase);
  const avatar = getAvatarById(avatarId ?? DEFAULT_AVATAR_ID);

  // Pulse animation
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!config.pulse) {
      pulseAnim.setValue(1);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [config.pulse, pulseAnim]);

  const outerPadding = config.ringWidth + 4; // space between image and outer ring
  const containerSize = size + outerPadding * 2;
  const borderRadius = containerSize / 2;

  // For phase 6 (prismatic): animate between ringColor and ringColor2
  const glowOpacityAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!config.pulse) {
      glowOpacityAnim.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacityAnim, {
          toValue: config.glowOpacity,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacityAnim, {
          toValue: config.glowOpacity * 0.3,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [config.pulse, config.glowOpacity, glowOpacityAnim]);

  const content = (
    <Animated.View
      style={[
        styles.outerRing,
        {
          width: containerSize,
          height: containerSize,
          borderRadius,
          borderWidth: config.ringWidth,
          borderColor: config.ringColor,
          transform: [{ scale: pulseAnim }],
        },
      ]}
    >
      {/* Glow layer */}
      {config.glowOpacity > 0 && (
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              borderRadius,
              backgroundColor: config.ringColor,
              opacity: glowOpacityAnim,
            },
          ]}
          pointerEvents="none"
        />
      )}

      {/* Phase 6: second ring overlay */}
      {phase >= 6 && config.ringColor2 && (
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              borderRadius,
              borderWidth: config.ringWidth,
              borderColor: config.ringColor2,
              opacity: glowOpacityAnim,
            },
          ]}
          pointerEvents="none"
        />
      )}

      {/* Avatar image */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: 'hidden',
          backgroundColor: Colors.neutral.gray100,
        }}
      >
        <Image
          source={avatar.source}
          style={{ width: size, height: size }}
          resizeMode="cover"
        />
      </View>
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} hitSlop={8}>
        {content}
      </Pressable>
    );
  }

  return content;
}

/**
 * Calculate phase (1–6) from the number of completed lessons.
 * Each phase = 30 lessons.
 */
export function calcPhase(completedLessonsCount: number): number {
  return Math.min(6, Math.floor(completedLessonsCount / 30) + 1);
}

export default PhaseAvatar;

const styles = StyleSheet.create({
  outerRing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
