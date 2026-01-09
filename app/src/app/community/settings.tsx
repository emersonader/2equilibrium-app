import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Layout } from '@/constants';
import { Card, Button } from '@/components/ui';
import { UserAvatar } from '@/components/community';
import { useCommunityStore, useUserStore } from '@/stores';
import * as communityService from '@/services/communityService';
import type { PublicProfile } from '@/services/database.types';

export default function CommunitySettingsScreen() {
  const router = useRouter();
  const { profile: currentUser } = useUserStore();
  const { myProfile, loadMyProfile, updateMyProfile } = useCommunityStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [showStreak, setShowStreak] = useState(true);
  const [showBadges, setShowBadges] = useState(true);
  const [showProgress, setShowProgress] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    setIsLoading(true);
    try {
      await loadMyProfile();
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update form when profile loads
  useEffect(() => {
    if (myProfile) {
      setDisplayName(myProfile.display_name);
      setBio(myProfile.bio || '');
      setIsPublic(myProfile.is_public);
      setShowStreak(myProfile.show_streak);
      setShowBadges(myProfile.show_badges);
      setShowProgress(myProfile.show_progress);
    } else if (currentUser) {
      // Default values for new profile
      setDisplayName(currentUser.full_name || 'Wellness Seeker');
    }
  }, [myProfile, currentUser]);

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Display name is required.');
      return;
    }

    setIsSaving(true);
    try {
      await updateMyProfile({
        display_name: displayName.trim(),
        bio: bio.trim() || null,
        is_public: isPublic,
        show_streak: showStreak,
        show_badges: showBadges,
        show_progress: showProgress,
      });
      Alert.alert('Success', 'Your profile has been updated.');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Community Settings',
            headerBackTitle: 'Back',
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.orange} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Community Settings',
          headerBackTitle: 'Back',
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Profile Preview */}
        <View style={styles.previewSection}>
          <UserAvatar
            name={displayName || 'You'}
            avatarUrl={myProfile?.avatar_url}
            size="xlarge"
          />
          <Text style={styles.previewName}>{displayName || 'Your Name'}</Text>
          {bio ? (
            <Text style={styles.previewBio}>{bio}</Text>
          ) : null}
        </View>

        {/* Profile Information */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Display Name</Text>
            <TextInput
              style={styles.textInput}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter your display name"
              placeholderTextColor={Colors.text.muted}
              maxLength={50}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Bio</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell others about your wellness journey..."
              placeholderTextColor={Colors.text.muted}
              multiline
              maxLength={200}
            />
            <Text style={styles.charCount}>{bio.length}/200</Text>
          </View>
        </Card>

        {/* Privacy Settings */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Public Profile</Text>
              <Text style={styles.settingDescription}>
                Allow others to find and follow you
              </Text>
            </View>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{ false: Colors.neutral.gray300, true: Colors.primary.orange }}
              thumbColor={Colors.background.primary}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Show Streak</Text>
              <Text style={styles.settingDescription}>
                Display your current streak on your profile
              </Text>
            </View>
            <Switch
              value={showStreak}
              onValueChange={setShowStreak}
              trackColor={{ false: Colors.neutral.gray300, true: Colors.primary.orange }}
              thumbColor={Colors.background.primary}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Show Badges</Text>
              <Text style={styles.settingDescription}>
                Display your earned badges
              </Text>
            </View>
            <Switch
              value={showBadges}
              onValueChange={setShowBadges}
              trackColor={{ false: Colors.neutral.gray300, true: Colors.primary.orange }}
              thumbColor={Colors.background.primary}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Show Progress</Text>
              <Text style={styles.settingDescription}>
                Display your journey completion percentage
              </Text>
            </View>
            <Switch
              value={showProgress}
              onValueChange={setShowProgress}
              trackColor={{ false: Colors.neutral.gray300, true: Colors.primary.orange }}
              thumbColor={Colors.background.primary}
            />
          </View>
        </Card>

        {/* Auto-Share Settings */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Auto-Share</Text>
          <Text style={styles.sectionDescription}>
            Automatically share your achievements with the community. You can always delete posts later.
          </Text>

          <View style={styles.autoShareInfo}>
            <View style={styles.autoShareItem}>
              <Ionicons name="ribbon" size={20} color={Colors.primary.orange} />
              <Text style={styles.autoShareText}>Badges earned</Text>
              <Ionicons name="checkmark-circle" size={20} color={Colors.status.success} />
            </View>
            <View style={styles.autoShareItem}>
              <Ionicons name="flame" size={20} color={Colors.status.warning} />
              <Text style={styles.autoShareText}>Streak milestones (7, 14, 30...)</Text>
              <Ionicons name="checkmark-circle" size={20} color={Colors.status.success} />
            </View>
            <View style={styles.autoShareItem}>
              <Ionicons name="trophy" size={20} color={Colors.primary.tiffanyBlue} />
              <Text style={styles.autoShareText}>Chapter completions</Text>
              <Ionicons name="checkmark-circle" size={20} color={Colors.status.success} />
            </View>
          </View>
        </Card>

        {/* Save Button */}
        <Button
          title="Save Changes"
          variant="primary"
          onPress={handleSave}
          loading={isSaving}
          disabled={isSaving}
          style={styles.saveButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Layout.screenPaddingHorizontal,
    paddingBottom: Spacing['4xl'],
  },

  // Preview
  previewSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  previewName: {
    ...Typography.h4,
    color: Colors.text.primary,
    marginTop: Spacing.md,
  },
  previewBio: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    maxWidth: 250,
  },

  // Sections
  section: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h5,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  sectionDescription: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },

  // Fields
  field: {
    marginBottom: Spacing.lg,
  },
  fieldLabel: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  textInput: {
    ...Typography.body,
    color: Colors.text.primary,
    backgroundColor: Colors.background.secondary,
    borderRadius: Spacing.borderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    ...Typography.caption,
    color: Colors.text.muted,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },

  // Settings
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingLabel: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  settingDescription: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.ui.border,
    marginVertical: Spacing.sm,
  },

  // Auto-share
  autoShareInfo: {
    gap: Spacing.sm,
  },
  autoShareItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  autoShareText: {
    ...Typography.bodySmall,
    color: Colors.text.primary,
    flex: 1,
  },

  // Save button
  saveButton: {
    marginTop: Spacing.lg,
  },
});
