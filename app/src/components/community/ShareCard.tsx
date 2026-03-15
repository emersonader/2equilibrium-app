import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Colors, Typography } from '@/constants';
import { Logo } from '@/components/ui/Logo';
import type { AchievementType, AchievementDetails } from '@/services/shareService';

const CARD_SIZE = 1080; // Square Instagram format

interface ShareCardProps {
  type: AchievementType;
  details: AchievementDetails;
  // For specific achievement types, we might have additional props
  badgeName?: string;
  streakCount?: number;
  phaseNumber?: number;
  phaseName?: string;
}

interface AchievementConfig {
  icon: string;
  title: string;
  subtitle: string;
  description: string;
}

export const ShareCard = forwardRef<View, ShareCardProps>(({ type, details, badgeName, streakCount, phaseNumber, phaseName }, ref) => {
  const config = getAchievementConfig(type, details, { badgeName, streakCount, phaseNumber, phaseName });
  
  return (
    <View ref={ref} style={styles.card}>
      {/* Background */}
      <View style={styles.background}>
        
        {/* Header with Logo */}
        <View style={styles.header}>
          <Logo size="lg" />
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Achievement Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{config.icon}</Text>
          </View>

          {/* Achievement Title */}
          <Text style={styles.title}>{config.title}</Text>
          
          {/* Achievement Subtitle */}
          {config.subtitle && (
            <Text style={styles.subtitle}>{config.subtitle}</Text>
          )}

          {/* Achievement Description */}
          <Text style={styles.description}>{config.description}</Text>

          {/* Decorative line */}
          <View style={styles.decorativeLine} />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.website}>www.2equilibrium.com</Text>
          <Text style={styles.hashtags}>#2Equilibrium #WellnessJourney</Text>
        </View>

        {/* Decorative elements */}
        <View style={styles.accentCircle1} />
        <View style={styles.accentCircle2} />
      </View>
    </View>
  );
});

function getAchievementConfig(
  type: AchievementType,
  details: AchievementDetails,
  options: { badgeName?: string; streakCount?: number; phaseNumber?: number; phaseName?: string }
): AchievementConfig {
  switch (type) {
    case 'badge':
      return {
        icon: '🏆',
        title: 'Badge Unlocked!',
        subtitle: options.badgeName || details.title,
        description: 'Earned on my wellness journey',
      };
    
    case 'streak':
      return {
        icon: '🔥',
        title: `${options.streakCount || 'Multi'}-Day Streak!`,
        subtitle: 'Consistency is key',
        description: 'Building healthy habits one day at a time',
      };
    
    case 'phase':
      return {
        icon: '✨',
        title: `Phase ${options.phaseNumber || ''} Complete!`,
        subtitle: options.phaseName || details.title,
        description: 'Moving forward on my 180-day journey',
      };
    
    case 'milestone':
    default:
      return {
        icon: '🎯',
        title: 'Milestone Reached!',
        subtitle: details.title,
        description: 'Every step counts',
      };
  }
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: -10000, // Hide off-screen for capture
    top: 0,
    width: CARD_SIZE,
    height: CARD_SIZE,
  },
  background: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.background.primary, // cream
    padding: 80,
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 60,
  },
  iconContainer: {
    marginBottom: 40,
  },
  icon: {
    fontSize: 120,
    textAlign: 'center',
  },
  title: {
    fontSize: 64,
    fontFamily: Typography.textStyles.h1.fontFamily,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 72,
  },
  subtitle: {
    fontSize: 36,
    fontFamily: Typography.textStyles.h3.fontFamily,
    fontWeight: '700',
    color: Colors.primary.orange,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 42,
  },
  description: {
    fontSize: 28,
    fontWeight: '400',
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 36,
    maxWidth: 700,
  },
  decorativeLine: {
    width: 120,
    height: 4,
    backgroundColor: Colors.primary.tiffanyBlue,
    marginTop: 40,
    borderRadius: 2,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  website: {
    fontSize: 24,
    fontWeight: '500',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  hashtags: {
    fontSize: 20,
    fontWeight: '400',
    color: Colors.text.muted,
  },
  // Subtle decorative elements
  accentCircle1: {
    position: 'absolute',
    top: 120,
    right: 80,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary.orangeLight,
    opacity: 0.3,
  },
  accentCircle2: {
    position: 'absolute',
    bottom: 200,
    left: 100,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary.tiffanyBlueLight,
    opacity: 0.5,
  },
});

ShareCard.displayName = 'ShareCard';

export default ShareCard;