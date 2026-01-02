import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface ExperienceOption {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const OPTIONS: ExperienceOption[] = [
  {
    id: 'beginner',
    title: 'Just beginning',
    description: "I'm new to wellness journeys and ready to learn",
    icon: 'leaf-outline',
  },
  {
    id: 'tried',
    title: "I've tried before",
    description: "I've attempted wellness programs but haven't found the right fit",
    icon: 'refresh-outline',
  },
  {
    id: 'fresh',
    title: 'Looking for a fresh approach',
    description: 'I have experience but want something different and sustainable',
    icon: 'sparkles-outline',
  },
];

export default function OnboardingExperience() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: '50%' }]} />
      </View>

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.step}>Step 2 of 4</Text>
          <Text style={styles.title}>How would you describe your journey so far?</Text>
          <Text style={styles.subtitle}>
            This helps us personalize your experience.
          </Text>
        </View>

        {/* Options */}
        <View style={styles.options}>
          {OPTIONS.map((option) => {
            const isSelected = selected === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                onPress={() => setSelected(option.id)}
                activeOpacity={0.8}
              >
                <Card
                  style={[
                    styles.optionCard,
                    isSelected ? styles.optionCardSelected : undefined,
                  ]}
                >
                  <View style={styles.optionHeader}>
                    <View
                      style={[
                        styles.optionIcon,
                        isSelected ? styles.optionIconSelected : undefined,
                      ]}
                    >
                      <Ionicons
                        name={option.icon}
                        size={24}
                        color={
                          isSelected ? Colors.neutral.white : Colors.primary.orange
                        }
                      />
                    </View>
                    <View
                      style={[
                        styles.radio,
                        isSelected && styles.radioSelected,
                      ]}
                    >
                      {isSelected && (
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color={Colors.neutral.white}
                        />
                      )}
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.optionTitle,
                      isSelected && styles.optionTitleSelected,
                    ]}
                  >
                    {option.title}
                  </Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </Card>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>

        <Button
          title="Continue"
          onPress={() => router.push('/onboarding/notifications')}
          disabled={!selected}
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
  options: {
    gap: Spacing.md,
  },
  optionCard: {
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: Colors.primary.orange,
    backgroundColor: Colors.primary.orangeLight,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary.orangeLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionIconSelected: {
    backgroundColor: Colors.primary.orange,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.text.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: Colors.primary.orange,
    backgroundColor: Colors.primary.orange,
  },
  optionTitle: {
    ...Typography.textStyles.h5,
    color: Colors.text.primary,
    marginBottom: Spacing.xxs,
  },
  optionTitleSelected: {
    color: Colors.primary.orange,
  },
  optionDescription: {
    ...Typography.textStyles.bodySmall,
    color: Colors.text.secondary,
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
