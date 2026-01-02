import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Button } from '@/components/ui/Button';

interface Goal {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const GOALS: Goal[] = [
  { id: 'energy', title: 'Find more energy', icon: 'flash-outline' },
  { id: 'body', title: 'Feel comfortable in my body', icon: 'body-outline' },
  { id: 'habits', title: 'Build sustainable habits', icon: 'repeat-outline' },
  { id: 'food', title: 'Improve my relationship with food', icon: 'nutrition-outline' },
  { id: 'mindset', title: 'Develop a positive mindset', icon: 'happy-outline' },
  { id: 'all', title: 'All of the above', icon: 'sparkles-outline' },
];

export default function OnboardingGoals() {
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const toggleGoal = (goalId: string) => {
    if (goalId === 'all') {
      // If "all" is selected, clear other selections
      setSelectedGoals((prev) =>
        prev.includes('all') ? [] : ['all']
      );
    } else {
      // Remove "all" if selecting specific goals
      setSelectedGoals((prev) => {
        const withoutAll = prev.filter((id) => id !== 'all');
        if (withoutAll.includes(goalId)) {
          return withoutAll.filter((id) => id !== goalId);
        }
        return [...withoutAll, goalId];
      });
    }
  };

  const canContinue = selectedGoals.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: '25%' }]} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.step}>Step 1 of 4</Text>
          <Text style={styles.title}>What brings you here today?</Text>
          <Text style={styles.subtitle}>
            Select all that resonate with you. There's no wrong answer.
          </Text>
        </View>

        {/* Goals */}
        <View style={styles.goals}>
          {GOALS.map((goal) => {
            const isSelected = selectedGoals.includes(goal.id);
            return (
              <TouchableOpacity
                key={goal.id}
                style={[styles.goalItem, isSelected && styles.goalItemSelected]}
                onPress={() => toggleGoal(goal.id)}
              >
                <View
                  style={[
                    styles.goalIcon,
                    isSelected && styles.goalIconSelected,
                  ]}
                >
                  <Ionicons
                    name={goal.icon}
                    size={24}
                    color={isSelected ? Colors.neutral.white : Colors.text.secondary}
                  />
                </View>
                <Text
                  style={[styles.goalText, isSelected && styles.goalTextSelected]}
                >
                  {goal.title}
                </Text>
                <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                  {isSelected && (
                    <Ionicons name="checkmark" size={16} color={Colors.neutral.white} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>

        <Button
          title="Continue"
          onPress={() => router.push('/onboarding/experience')}
          disabled={!canContinue}
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
  },
  contentContainer: {
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
  goals: {
    gap: Spacing.sm,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderRadius: Spacing.borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  goalItemSelected: {
    borderColor: Colors.primary.orange,
    backgroundColor: Colors.primary.orangeLight,
  },
  goalIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  goalIconSelected: {
    backgroundColor: Colors.primary.orange,
  },
  goalText: {
    ...Typography.textStyles.body,
    color: Colors.text.primary,
    flex: 1,
  },
  goalTextSelected: {
    fontWeight: '600',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.text.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    borderColor: Colors.primary.orange,
    backgroundColor: Colors.primary.orange,
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
