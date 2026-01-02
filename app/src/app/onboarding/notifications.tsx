import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function OnboardingNotifications() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [selectedTime, setSelectedTime] = useState('9:00 AM');

  const times = ['7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '12:00 PM'];

  const handleContinue = async () => {
    // In a real app, we'd request notification permissions here
    // and save the preferences
    router.push('/onboarding/subscription');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: '75%' }]} />
      </View>

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.step}>Step 3 of 4</Text>
          <Text style={styles.title}>When would you like your daily wisdom?</Text>
          <Text style={styles.subtitle}>
            We'll send gentle reminders to support your journey.
          </Text>
        </View>

        {/* Notifications Toggle */}
        <Card style={styles.toggleCard}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Ionicons
                name="notifications-outline"
                size={24}
                color={Colors.primary.orange}
              />
              <View style={styles.toggleText}>
                <Text style={styles.toggleTitle}>Daily Reminders</Text>
                <Text style={styles.toggleSubtitle}>
                  Receive your daily lesson notification
                </Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{
                false: Colors.background.tertiary,
                true: Colors.primary.orangeLight,
              }}
              thumbColor={
                notificationsEnabled ? Colors.primary.orange : Colors.neutral.gray300
              }
            />
          </View>
        </Card>

        {/* Time Selection */}
        {notificationsEnabled && (
          <View style={styles.timeSection}>
            <Text style={styles.timeSectionTitle}>Preferred time</Text>
            <View style={styles.timeOptions}>
              {times.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeOption,
                    selectedTime === time && styles.timeOptionSelected,
                  ]}
                  onPress={() => setSelectedTime(time)}
                >
                  <Text
                    style={[
                      styles.timeText,
                      selectedTime === time && styles.timeTextSelected,
                    ]}
                  >
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <Ionicons
            name="heart-outline"
            size={20}
            color={Colors.primary.tiffanyBlue}
          />
          <Text style={styles.infoText}>
            Don't worry — our reminders are always gentle and supportive. You can adjust
            these settings anytime.
          </Text>
        </Card>
      </View>

      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>

        <Button
          title="Continue"
          onPress={handleContinue}
          style={styles.continueButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.background.tertiary,
    marginHorizontal: Spacing.layout.screenPadding,
    borderRadius: Spacing.borderRadius.full,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary.orange,
    borderRadius: Spacing.borderRadius.full,
  },
  content: {
    flex: 1,
    padding: Spacing.layout.screenPadding,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  step: {
    ...Typography.textStyles.caption,
    color: Colors.primary.orange,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  title: {
    ...Typography.textStyles.h2,
    color: Colors.text.primary,
  },
  subtitle: {
    ...Typography.textStyles.body,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  toggleCard: {
    marginBottom: Spacing.lg,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggleText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  toggleTitle: {
    ...Typography.textStyles.body,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  toggleSubtitle: {
    ...Typography.textStyles.caption,
    color: Colors.text.secondary,
  },
  timeSection: {
    marginBottom: Spacing.lg,
  },
  timeSectionTitle: {
    ...Typography.textStyles.caption,
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  timeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  timeOption: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderRadius: Spacing.borderRadius.full,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  timeOptionSelected: {
    borderColor: Colors.primary.orange,
    backgroundColor: Colors.primary.orangeLight,
  },
  timeText: {
    ...Typography.textStyles.body,
    color: Colors.text.primary,
  },
  timeTextSelected: {
    color: Colors.primary.orange,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.primary.tiffanyBlueLight,
    padding: Spacing.md,
  },
  infoText: {
    ...Typography.textStyles.bodySmall,
    color: Colors.text.secondary,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.layout.screenPadding,
    borderTopWidth: 1,
    borderTopColor: Colors.background.tertiary,
  },
  backButton: {
    padding: Spacing.sm,
    marginRight: Spacing.md,
  },
  continueButton: {
    flex: 1,
  },
});
