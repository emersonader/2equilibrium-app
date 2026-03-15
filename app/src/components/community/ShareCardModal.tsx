import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/constants';
import { ShareCard } from './ShareCard';
import { shareAchievementCard, type AchievementType, type AchievementDetails } from '@/services/shareService';

const { width: screenWidth } = Dimensions.get('window');
const PREVIEW_SIZE = Math.min(screenWidth - 80, 320); // Responsive preview size

interface ShareCardModalProps {
  visible: boolean;
  onClose: () => void;
  type: AchievementType;
  details: AchievementDetails;
  // Optional props for different achievement types
  badgeName?: string;
  streakCount?: number;
  phaseNumber?: number;
  phaseName?: string;
}

export function ShareCardModal({
  visible,
  onClose,
  type,
  details,
  badgeName,
  streakCount,
  phaseNumber,
  phaseName,
}: ShareCardModalProps) {
  const cardRef = useRef(null);
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (!cardRef.current) {
      Alert.alert('Error', 'Unable to generate share card');
      return;
    }

    setIsSharing(true);
    try {
      const result = await shareAchievementCard(cardRef.current, type, details);
      
      if (result.success) {
        onClose();
      } else if (result.error && result.error !== 'Share dialog dismissed') {
        Alert.alert('Share Failed', result.error);
      }
    } catch (error) {
      Alert.alert('Share Failed', 'Unable to share achievement card');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Share Achievement</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.description}>
            Share your achievement with a beautiful branded card!
          </Text>

          {/* Preview Container */}
          <View style={styles.previewContainer}>
            <View style={styles.preview}>
              {/* Scaled down version for preview */}
              <View style={styles.previewCard}>
                <View style={styles.previewBackground}>
                  {/* Mini logo */}
                  <View style={styles.previewHeader}>
                    <Text style={styles.previewLogo}>
                      <Text style={styles.previewLogoOrange}>2</Text>
                      <Text style={styles.previewLogoNavy}>Equilibrium</Text>
                    </Text>
                  </View>

                  {/* Preview content */}
                  <View style={styles.previewContent}>
                    <Text style={styles.previewIcon}>
                      {type === 'badge' ? '🏆' : 
                       type === 'streak' ? '🔥' :
                       type === 'phase' ? '✨' : '🎯'}
                    </Text>
                    <Text style={styles.previewTitle}>
                      {type === 'badge' ? 'Badge Unlocked!' :
                       type === 'streak' ? `${streakCount || 'Multi'}-Day Streak!` :
                       type === 'phase' ? `Phase ${phaseNumber || ''} Complete!` :
                       'Milestone Reached!'}
                    </Text>
                    <Text style={styles.previewSubtitle}>
                      {badgeName || phaseName || details.title || 'Achievement'}
                    </Text>
                  </View>

                  {/* Preview footer */}
                  <View style={styles.previewFooter}>
                    <Text style={styles.previewWebsite}>www.2equilibrium.com</Text>
                    <Text style={styles.previewHashtags}>#2Equilibrium</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.shareButton]}
              onPress={handleShare}
              disabled={isSharing}
              activeOpacity={0.7}
            >
              <Text style={styles.shareButtonText}>
                {isSharing ? 'Sharing...' : 'Share Card'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Hidden ShareCard component for capture */}
        <ShareCard
          ref={cardRef}
          type={type}
          details={details}
          badgeName={badgeName}
          streakCount={streakCount}
          phaseNumber={phaseNumber}
          phaseName={phaseName}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.border,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    ...Typography.textStyles.h4,
    color: Colors.text.primary,
  },
  placeholder: {
    width: 40, // Same as close button to center title
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  description: {
    ...Typography.textStyles.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  preview: {
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    borderRadius: Spacing.borderRadius.lg,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: Colors.neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  previewCard: {
    flex: 1,
  },
  previewBackground: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    padding: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewHeader: {
    alignItems: 'center',
  },
  previewLogo: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplay_700Bold',
  },
  previewLogoOrange: {
    color: Colors.primary.orange,
  },
  previewLogoNavy: {
    color: Colors.text.primary,
  },
  previewContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  previewIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  previewTitle: {
    fontSize: 16,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  previewSubtitle: {
    fontSize: 12,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: Colors.primary.orange,
    textAlign: 'center',
  },
  previewFooter: {
    alignItems: 'center',
  },
  previewWebsite: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  previewHashtags: {
    fontSize: 8,
    color: Colors.text.muted,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Spacing.borderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.neutral.gray100,
  },
  cancelButtonText: {
    ...Typography.textStyles.button,
    color: Colors.text.secondary,
  },
  shareButton: {
    backgroundColor: Colors.primary.orange,
  },
  shareButtonText: {
    ...Typography.textStyles.button,
    color: Colors.neutral.white,
  },
});

export default ShareCardModal;