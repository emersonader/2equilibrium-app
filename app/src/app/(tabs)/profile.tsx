import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
  Switch,
  TextInput,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Layout, BorderRadius, SUBSCRIPTION_PRICING } from '@/constants';
import { Card, Button, Badge, ProgressRing } from '@/components/ui';
import { HealthMetricsSection, HealthConnectSection } from '@/components/health';
import { BadgeList } from '@/components/badges';
import { useUserStore, useProgressStore, useBadgeStore, useNotificationStore } from '@/stores';
import * as journalService from '@/services/journalService';
import * as biometricService from '@/services/biometricService';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface SettingsItemProps {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showChevron?: boolean;
  rightElement?: React.ReactNode;
}

function SettingsItem({
  icon,
  title,
  subtitle,
  onPress,
  showChevron = true,
  rightElement,
}: SettingsItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingsItem,
        pressed && styles.settingsItemPressed,
      ]}
    >
      <View style={styles.settingsIconContainer}>
        <Ionicons name={icon} size={22} color={Colors.primary.orange} />
      </View>
      <View style={styles.settingsContent}>
        <Text style={styles.settingsTitle}>{title}</Text>
        {subtitle && (
          <Text style={styles.settingsSubtitle}>{subtitle}</Text>
        )}
      </View>
      {rightElement || (showChevron && (
        <Ionicons name="chevron-forward" size={20} color={Colors.text.muted} />
      ))}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, signOut, isLoading } = useUserStore();
  const { currentStreak, longestStreak, completedLessons, refreshFromServer } = useProgressStore();
  const { badges, stats, loadBadges, loadStats } = useBadgeStore();
  const {
    reminderEnabled,
    reminderHour,
    reminderMinute,
    permissionGranted,
    toggleReminder,
    setReminderTime,
    refreshPermissionStatus,
    requestPermissions,
  } = useNotificationStore();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [journalEntriesCount, setJournalEntriesCount] = useState(0);

  // Notification time picker state
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState(reminderHour);
  const [selectedMinute, setSelectedMinute] = useState(reminderMinute);

  // Biometric state
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState('Biometric');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [isEnablingBiometric, setIsEnablingBiometric] = useState(false);

  // Dev mode: tap version 5 times to unlock all lessons
  const versionTapCount = useRef(0);
  const versionTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleVersionTap = useCallback(() => {
    versionTapCount.current += 1;
    if (versionTapTimer.current) clearTimeout(versionTapTimer.current);
    versionTapTimer.current = setTimeout(() => { versionTapCount.current = 0; }, 2000);

    if (versionTapCount.current >= 5) {
      versionTapCount.current = 0;
      Alert.alert(
        'Developer Mode',
        'Unlock all 180 lessons? This will mark every lesson as complete.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Unlock All',
            style: 'destructive',
            onPress: async () => {
              try {
                const allLessonIds = Array.from({ length: 180 }, (_, i) => `lesson_day_${i + 1}`);
                // Build quiz scores for all 36 chapters (score 100 each)
                const allQuizScores: Record<string, number> = {};
                for (let i = 1; i <= 36; i++) {
                  allQuizScores[`chapter_${i}`] = 100;
                }
                const { useProgressStore } = require('@/stores');
                useProgressStore.setState({
                  completedLessons: allLessonIds,
                  currentDay: 180,
                  quizScores: allQuizScores,
                });
                Alert.alert('Done', 'All 180 lessons and 36 quizzes unlocked!');
              } catch (error) {
                console.error('Failed to unlock lessons:', error);
                Alert.alert('Error', 'Failed to unlock lessons.');
              }
            },
          },
        ]
      );
    }
  }, []);

  // Get earned badges for showcase
  const earnedBadges = badges.filter(b => b.earned).slice(0, 6);

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshFromServer();
      loadJournalCount();
      loadBadges();
      loadStats();
      checkBiometricStatus();
      refreshPermissionStatus();
    }, [refreshFromServer, loadBadges, loadStats, refreshPermissionStatus])
  );

  // Check biometric availability and status
  const checkBiometricStatus = async () => {
    const supported = await biometricService.isBiometricSupported();
    setBiometricSupported(supported);

    if (supported) {
      const label = await biometricService.getBiometricLabel();
      setBiometricLabel(label);

      const enabled = await biometricService.isBiometricEnabled();
      setBiometricEnabled(enabled);
    }
  };

  // Handle biometric toggle
  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      // Enabling - need to verify and save credentials
      setShowPasswordModal(true);
    } else {
      // Disabling - clear credentials
      Alert.alert(
        `Disable ${biometricLabel}`,
        `Are you sure you want to disable ${biometricLabel} login?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              await biometricService.clearBiometricCredentials();
              setBiometricEnabled(false);
            },
          },
        ]
      );
    }
  };

  // Handle password confirmation for enabling biometrics
  const handleConfirmPassword = async () => {
    if (!passwordInput.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setIsEnablingBiometric(true);
    try {
      // First, authenticate with biometrics to confirm device ownership
      const authResult = await biometricService.authenticateWithBiometrics(
        `Enable ${biometricLabel} login`
      );

      if (!authResult.success) {
        Alert.alert('Authentication Failed', authResult.error || 'Please try again');
        setIsEnablingBiometric(false);
        return;
      }

      // Save credentials securely
      const email = profile?.id || '';
      const saved = await biometricService.saveBiometricCredentials(email, passwordInput);

      if (saved) {
        setBiometricEnabled(true);
        setShowPasswordModal(false);
        setPasswordInput('');
        Alert.alert('Success', `${biometricLabel} login enabled`);
      } else {
        Alert.alert('Error', 'Failed to save credentials. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred. Please try again.');
    } finally {
      setIsEnablingBiometric(false);
    }
  };

  // Notification handlers
  const handleNotificationToggle = async () => {
    if (!reminderEnabled && !permissionGranted) {
      // Need to request permissions first
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(
          'Notification Permission Required',
          'Please enable notifications in Settings to receive daily reminders.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => Linking.openSettings(),
            },
          ]
        );
        return;
      }
    }
    
    await toggleReminder();
  };

  const handleTimeChange = () => {
    setSelectedHour(reminderHour);
    setSelectedMinute(reminderMinute);
    setShowTimePicker(true);
  };

  const handleTimeConfirm = async () => {
    await setReminderTime(selectedHour, selectedMinute);
    setShowTimePicker(false);
  };

  const formatTime = (hour: number, minute: number): string => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const displayMinute = minute.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${period}`;
  };

  const getTimeOptions = () => {
    const times = [];
    for (let hour = 6; hour <= 22; hour++) {
      times.push({ hour, minute: 0, label: formatTime(hour, 0) });
      times.push({ hour, minute: 30, label: formatTime(hour, 30) });
    }
    return times;
  };

  const loadJournalCount = async () => {
    try {
      const entries = await journalService.getAllEntries();
      setJournalEntriesCount(entries.length);
    } catch (error) {
      console.error('Failed to load journal count:', error);
    }
  };

  // Calculate chapters completed (a chapter is complete if all 5 lessons are done)
  const chaptersCompleted = Math.floor(completedLessons.length / 5);

  // Use profile data if available, otherwise use defaults
  const user = {
    name: profile?.full_name || 'Wellness Seeker',
    email: profile?.id ? 'Your Account' : 'user@example.com',
    subscriptionTier: 'transformation' as const,
    memberSince: new Date('2024-01-01'),
    stats: {
      currentStreak: currentStreak,
      longestStreak: longestStreak,
      lessonsCompleted: completedLessons.length,
      journalEntries: journalEntriesCount,
      chaptersCompleted: chaptersCompleted,
    },
  };

  const handleManageSubscription = () => {
    Alert.alert(
      'Manage Subscription',
      'You can manage your subscription through your device settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => {
            if (Platform.OS === 'ios') {
              Linking.openURL('https://apps.apple.com/account/subscriptions');
            } else {
              Linking.openURL('https://play.google.com/store/account/subscriptions');
            }
          },
        },
      ]
    );
  };

  const handleAppearance = () => {
    Alert.alert(
      'Appearance',
      'Dark mode coming soon! Currently using light mode.',
      [{ text: 'OK' }]
    );
  };

  const handleOfflineContent = () => {
    Alert.alert(
      'Offline Content',
      'Offline content downloading coming soon! Your lessons will be available offline in a future update.',
      [{ text: 'OK' }]
    );
  };

  const handleExportJournal = async () => {
    try {
      const csvData = await journalService.exportJournalAsCsv();
      if (csvData.split('\n').length <= 1) {
        Alert.alert('No Entries', 'You have no journal entries to export yet.');
        return;
      }
      Alert.alert(
        'Export Journal',
        'Journal export feature coming soon! Your entries will be exportable as CSV in a future update.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to export journal. Please try again.');
    }
  };

  const handleHelp = () => {
    Linking.openURL('https://www.2equilibrium.com/help');
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@2equilibrium.com?subject=App Support');
  };

  const handleRateApp = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('https://apps.apple.com/app/id0000000000'); // Replace with actual App Store ID
    } else {
      Linking.openURL('https://play.google.com/store/apps/details?id=com.2equilibrium.app'); // Replace with actual package name
    }
  };

  const handleTerms = () => {
    Linking.openURL('https://www.2equilibrium.com/terms');
  };

  const handlePrivacy = () => {
    Linking.openURL('https://www.2equilibrium.com/privacy');
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setIsSigningOut(true);
            try {
              await signOut();
              router.replace('/(auth)/login');
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            } finally {
              setIsSigningOut(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* User Card */}
        <Card variant="elevated" style={styles.userCard}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <Badge
                label={user.subscriptionTier.charAt(0).toUpperCase() + user.subscriptionTier.slice(1)}
                variant="secondary"
                size="sm"
              />
            </View>
          </View>
        </Card>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <Card variant="default" padding="md" style={styles.statCard}>
            <Text style={styles.statValue}>{user.stats.currentStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </Card>
          <Card variant="default" padding="md" style={styles.statCard}>
            <Text style={styles.statValue}>{user.stats.lessonsCompleted}</Text>
            <Text style={styles.statLabel}>Lessons</Text>
          </Card>
          <Card variant="default" padding="md" style={styles.statCard}>
            <Text style={styles.statValue}>{user.stats.journalEntries}</Text>
            <Text style={styles.statLabel}>Journal Entries</Text>
          </Card>
          <Card variant="default" padding="md" style={styles.statCard}>
            <Text style={styles.statValue}>{user.stats.chaptersCompleted}</Text>
            <Text style={styles.statLabel}>Chapters</Text>
          </Card>
        </View>

        {/* Badge Showcase */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Badges</Text>
            <Pressable onPress={() => router.push('/badges')}>
              <Text style={styles.sectionLink}>
                View All ({stats.totalBadges}/{stats.totalAvailable})
              </Text>
            </Pressable>
          </View>
          {earnedBadges.length > 0 ? (
            <BadgeList
              badges={earnedBadges}
              onBadgePress={(badge) => router.push(`/badges/${badge.id}`)}
            />
          ) : (
            <Card variant="outlined" style={styles.emptyBadgesCard}>
              <Ionicons name="ribbon-outline" size={32} color={Colors.text.muted} />
              <Text style={styles.emptyBadgesText}>
                Complete lessons and journal entries to earn badges!
              </Text>
              <Button
                title="View All Badges"
                variant="outline"
                size="sm"
                onPress={() => router.push('/badges')}
              />
            </Card>
          )}
        </View>

        {/* Health Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health & Wellness</Text>
          <HealthMetricsSection />
        </View>

        {/* Health Connect (Apple Health / Google Health Connect) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Sync</Text>
          <HealthConnectSection />
        </View>

        {/* Subscription */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          <Card variant="outlined" style={styles.subscriptionCard}>
            <View style={styles.subscriptionHeader}>
              <View>
                <Text style={styles.subscriptionPlan}>
                  {user.subscriptionTier.charAt(0).toUpperCase() + user.subscriptionTier.slice(1)} Plan
                </Text>
                <Text style={styles.subscriptionPrice}>
                  ${SUBSCRIPTION_PRICING[user.subscriptionTier].price} / {SUBSCRIPTION_PRICING[user.subscriptionTier].period.replace('_', ' ')}
                </Text>
              </View>
              <Badge label="Active" variant="success" />
            </View>
            <Button
              title="Manage Subscription"
              variant="outline"
              size="sm"
              onPress={handleManageSubscription}
              style={styles.subscriptionButton}
            />
          </Card>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          {/* Notifications Section */}
          <View style={styles.subsectionContainer}>
            <Text style={styles.subsectionTitle}>Notifications</Text>
            <Card variant="default" padding="none" style={styles.settingsCard}>
              <SettingsItem
                icon="notifications-outline"
                title="Daily Reminder"
                subtitle={reminderEnabled ? 
                  `Reminder at ${formatTime(reminderHour, reminderMinute)}` : 
                  'Get daily lesson reminders'
                }
                onPress={handleNotificationToggle}
                showChevron={false}
                rightElement={
                  <Switch
                    value={reminderEnabled}
                    onValueChange={handleNotificationToggle}
                    trackColor={{ false: Colors.ui.border, true: Colors.primary.tiffanyBlue }}
                    thumbColor={reminderEnabled ? Colors.background.primary : Colors.text.muted}
                  />
                }
              />
              {reminderEnabled && (
                <>
                  <View style={styles.settingsDivider} />
                  <SettingsItem
                    icon="time-outline"
                    title="Reminder Time"
                    subtitle={formatTime(reminderHour, reminderMinute)}
                    onPress={handleTimeChange}
                  />
                </>
              )}
            </Card>
          </View>

          {/* Other Settings */}
          <Card variant="default" padding="none" style={styles.settingsCard}>
            <View style={styles.settingsDivider} />
            {biometricSupported && (
              <>
                <SettingsItem
                  icon={biometricLabel === 'Face ID' ? 'scan-outline' : 'finger-print-outline'}
                  title={`Use ${biometricLabel}`}
                  subtitle="Quick login with biometrics"
                  onPress={() => handleBiometricToggle(!biometricEnabled)}
                  showChevron={false}
                  rightElement={
                    <Switch
                      value={biometricEnabled}
                      onValueChange={handleBiometricToggle}
                      trackColor={{ false: Colors.ui.border, true: Colors.primary.tiffanyBlue }}
                      thumbColor={biometricEnabled ? Colors.background.primary : Colors.text.muted}
                    />
                  }
                />
                <View style={styles.settingsDivider} />
              </>
            )}
            <SettingsItem
              icon="moon-outline"
              title="Appearance"
              subtitle="Light mode"
              onPress={handleAppearance}
            />
            <View style={styles.settingsDivider} />
            <SettingsItem
              icon="download-outline"
              title="Offline Content"
              subtitle="Download lessons for offline use"
              onPress={handleOfflineContent}
            />
            <View style={styles.settingsDivider} />
            <SettingsItem
              icon="document-text-outline"
              title="Export Journal"
              subtitle="Download your journal entries"
              onPress={handleExportJournal}
            />
          </Card>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <Card variant="default" padding="none" style={styles.settingsCard}>
            <SettingsItem
              icon="help-circle-outline"
              title="Help & FAQ"
              onPress={handleHelp}
            />
            <View style={styles.settingsDivider} />
            <SettingsItem
              icon="chatbubble-outline"
              title="Contact Support"
              onPress={handleContactSupport}
            />
            <View style={styles.settingsDivider} />
            <SettingsItem
              icon="star-outline"
              title="Rate the App"
              onPress={handleRateApp}
            />
          </Card>
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <Card variant="default" padding="none" style={styles.settingsCard}>
            <SettingsItem
              icon="document-outline"
              title="Terms of Service"
              onPress={handleTerms}
            />
            <View style={styles.settingsDivider} />
            <SettingsItem
              icon="shield-outline"
              title="Privacy Policy"
              onPress={handlePrivacy}
            />
          </Card>
        </View>

        {/* Sign Out */}
        <Button
          title="Sign Out"
          variant="ghost"
          onPress={handleSignOut}
          disabled={isSigningOut}
          loading={isSigningOut}
          style={styles.signOutButton}
          textStyle={styles.signOutButtonText}
        />

        {/* Version */}
        <Pressable onPress={handleVersionTap}>
          <Text style={styles.version}>Version 1.0.0</Text>
        </Pressable>
      </ScrollView>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Reminder Time</Text>
            <Text style={styles.modalDescription}>
              Choose when you'd like to receive your daily wellness lesson reminder
            </Text>
            
            <ScrollView style={styles.timePickerScrollView} showsVerticalScrollIndicator={false}>
              {getTimeOptions().map(({ hour, minute, label }) => (
                <TouchableOpacity
                  key={`${hour}-${minute}`}
                  style={[
                    styles.timePickerOption,
                    selectedHour === hour && selectedMinute === minute && styles.timePickerOptionSelected
                  ]}
                  onPress={() => {
                    setSelectedHour(hour);
                    setSelectedMinute(minute);
                  }}
                >
                  <Text style={[
                    styles.timePickerOptionText,
                    selectedHour === hour && selectedMinute === minute && styles.timePickerOptionTextSelected
                  ]}>
                    {label}
                  </Text>
                  {selectedHour === hour && selectedMinute === minute && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary.orange} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setShowTimePicker(false)}
                style={styles.modalButton}
              />
              <Button
                title="Save"
                variant="primary"
                onPress={handleTimeConfirm}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Password Confirmation Modal for Biometric Setup */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowPasswordModal(false);
          setPasswordInput('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enable {biometricLabel}</Text>
            <Text style={styles.modalDescription}>
              Enter your password to enable {biometricLabel} login
            </Text>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter your password"
              placeholderTextColor={Colors.text.muted}
              secureTextEntry
              value={passwordInput}
              onChangeText={setPasswordInput}
              autoCapitalize="none"
            />
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => {
                  setShowPasswordModal(false);
                  setPasswordInput('');
                }}
                style={styles.modalButton}
              />
              <Button
                title="Enable"
                variant="primary"
                onPress={handleConfirmPassword}
                loading={isEnablingBiometric}
                disabled={isEnablingBiometric}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Layout.screenPaddingHorizontal,
    paddingBottom: Spacing['4xl'],
  },
  header: {
    marginBottom: Spacing.xl,
    marginTop: Spacing.base,
  },
  title: {
    ...Typography.h1,
    color: Colors.text.primary,
  },

  // User card
  userCard: {
    marginBottom: Spacing.xl,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary.orangeLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.h2,
    color: Colors.primary.orange,
  },
  userDetails: {
    flex: 1,
    gap: Spacing.xs,
  },
  userName: {
    ...Typography.h4,
    color: Colors.text.primary,
  },
  userEmail: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
  },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  statValue: {
    ...Typography.h2,
    color: Colors.primary.orange,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Sections
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h5,
    color: Colors.text.primary,
  },
  sectionLink: {
    ...Typography.bodySmall,
    color: Colors.primary.orange,
    fontWeight: '600',
  },

  // Badge showcase
  emptyBadgesCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  emptyBadgesText: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
  },

  // Subscription
  subscriptionCard: {
    gap: Spacing.md,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  subscriptionPlan: {
    ...Typography.h5,
    color: Colors.text.primary,
  },
  subscriptionPrice: {
    ...Typography.body,
    color: Colors.text.secondary,
  },
  subscriptionButton: {
    marginTop: Spacing.sm,
  },

  // Settings
  settingsCard: {
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    gap: Spacing.md,
  },
  settingsItemPressed: {
    backgroundColor: Colors.background.secondary,
  },
  settingsIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary.orangeLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsContent: {
    flex: 1,
  },
  settingsTitle: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  settingsSubtitle: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
  },
  settingsDivider: {
    height: 1,
    backgroundColor: Colors.ui.border,
    marginLeft: Spacing.base + 36 + Spacing.md,
  },

  // Sign out
  signOutButton: {
    marginTop: Spacing.xl,
  },
  signOutButtonText: {
    color: Colors.status.error,
  },

  // Version
  version: {
    ...Typography.caption,
    color: Colors.text.muted,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    ...Typography.h4,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  modalDescription: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  passwordInput: {
    ...Typography.body,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.xl,
    color: Colors.text.primary,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
  },

  // Notification settings
  subsectionContainer: {
    marginBottom: Spacing.lg,
  },
  subsectionTitle: {
    ...Typography.h5,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    fontSize: 16, // Slightly smaller than h5
  },

  // Time picker modal
  timePickerScrollView: {
    maxHeight: 300,
    marginVertical: Spacing.md,
  },
  timePickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
    backgroundColor: Colors.background.secondary,
  },
  timePickerOptionSelected: {
    backgroundColor: Colors.primary.orangeLight + '20',
    borderWidth: 1,
    borderColor: Colors.primary.orange,
  },
  timePickerOptionText: {
    ...Typography.body,
    color: Colors.text.primary,
  },
  timePickerOptionTextSelected: {
    color: Colors.primary.orange,
    fontWeight: '600',
  },
});
