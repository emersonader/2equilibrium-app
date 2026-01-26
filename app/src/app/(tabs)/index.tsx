import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Typography, Spacing, Layout, BorderRadius } from '@/constants';
import { Button, Card, ProgressRing, Badge } from '@/components/ui';
import { useProgressStore } from '@/stores/progressStore';
import * as progressService from '@/services/progressService';
import lessonsData from '@/data/content/lessons.json';

// Get greeting based on time of day
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

export default function TodayScreen() {
  const router = useRouter();
  const { currentDay, currentStreak, completedLessons, refreshFromServer } = useProgressStore();
  const [greeting, setGreeting] = useState(getGreeting());
  const [lessonAccess, setLessonAccess] = useState<{
    canAccess: boolean;
    reason?: string;
    previousLessonStatus?: {
      journalComplete: boolean;
      movementComplete: boolean;
    };
  }>({ canAccess: true });

  // Load progress and update greeting whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshFromServer();
      setGreeting(getGreeting());
    }, [])
  );

  // Check if current day's lesson is accessible
  useEffect(() => {
    const checkAccess = async () => {
      const access = await progressService.canAccessLesson(currentDay);
      setLessonAccess(access);
    };
    checkAccess();
  }, [currentDay, completedLessons]);

  // Get today's lesson based on current day
  const todayLessonData = lessonsData.lessons.find(l => l.dayNumber === currentDay);
  const isLessonCompleted = completedLessons.includes(todayLessonData?.id || '');

  // Get previous lesson for locked state message
  const previousLessonData = lessonsData.lessons.find(l => l.dayNumber === currentDay - 1);

  const todayLesson = {
    id: todayLessonData?.id || 'lesson_day_1',
    title: todayLessonData?.title || 'Setting Your Wellness Intention',
    subtitle: `Chapter ${todayLessonData?.chapterId?.replace('chapter_', '') || '1'}: ${todayLessonData?.title || 'Awakening Your Wellness Path'}`,
    completed: isLessonCompleted,
  };

  const dailyAffirmation = todayLessonData?.affirmation ||
    'I am worthy of taking care of myself and creating a life filled with wellness and joy.';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.title}>Day {currentDay}</Text>
        </View>

        {/* Progress Card */}
        <Card variant="elevated" style={styles.streakCard}>
          <View style={styles.streakContent}>
            <ProgressRing
              progress={(completedLessons.length / 30) * 100}
              size={70}
              color={Colors.primary.tiffanyBlue}
            />
            <View style={styles.streakInfo}>
              <Text style={styles.streakLabel}>Phase 1 Progress</Text>
              <Text style={styles.streakValue}>{completedLessons.length}/30 lessons</Text>
              <Text style={styles.streakSubtext}>
                {currentStreak > 0 ? `${currentStreak} day streak` : 'Start your streak today!'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Today's Lesson Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isLessonCompleted ? "Today's Progress" : "Today's Lesson"}
          </Text>
          {isLessonCompleted ? (
            <Card variant="elevated" style={styles.lessonCard}>
              <Badge
                label="Completed"
                variant="success"
                size="sm"
              />
              <Text style={styles.lessonTitle}>Great work today!</Text>
              <Text style={styles.lessonSubtitle}>
                You've completed Day {currentDay}. Complete your journal and movement to unlock tomorrow's lesson.
              </Text>
              <Button
                title="Review Today's Lesson"
                onPress={() => router.push(`/lesson/${todayLesson.id}`)}
                variant="outline"
                fullWidth
                style={styles.lessonButton}
              />
            </Card>
          ) : !lessonAccess.canAccess && lessonAccess.previousLessonStatus ? (
            // Locked state - previous lesson not fully complete
            <Card variant="elevated" style={styles.lockedCard}>
              <View style={styles.lockedHeader}>
                <Ionicons name="lock-closed" size={32} color={Colors.text.tertiary} />
                <Badge
                  label="Locked"
                  variant="secondary"
                  size="sm"
                />
              </View>
              <Text style={styles.lockedTitle}>Day {currentDay} is Locked</Text>
              <Text style={styles.lockedSubtitle}>
                Complete yesterday's lesson requirements to unlock:
              </Text>
              <View style={styles.requirementsList}>
                <View style={styles.requirementItem}>
                  <Ionicons
                    name={lessonAccess.previousLessonStatus.journalComplete ? "checkmark-circle" : "ellipse-outline"}
                    size={20}
                    color={lessonAccess.previousLessonStatus.journalComplete ? Colors.status.success : Colors.text.tertiary}
                  />
                  <Text style={[
                    styles.requirementText,
                    lessonAccess.previousLessonStatus.journalComplete && styles.requirementComplete
                  ]}>
                    Journal entry (all 3 prompts)
                  </Text>
                </View>
                <View style={styles.requirementItem}>
                  <Ionicons
                    name={lessonAccess.previousLessonStatus.movementComplete ? "checkmark-circle" : "ellipse-outline"}
                    size={20}
                    color={lessonAccess.previousLessonStatus.movementComplete ? Colors.status.success : Colors.text.tertiary}
                  />
                  <Text style={[
                    styles.requirementText,
                    lessonAccess.previousLessonStatus.movementComplete && styles.requirementComplete
                  ]}>
                    Daily movement completed
                  </Text>
                </View>
              </View>
              <Button
                title={`Complete Day ${currentDay - 1}`}
                onPress={() => router.push(`/lesson/${previousLessonData?.id}`)}
                variant="primary"
                fullWidth
                style={styles.lessonButton}
              />
            </Card>
          ) : (
            <Card
              variant="elevated"
              onPress={() => router.push(`/lesson/${todayLesson.id}`)}
              style={styles.lessonCard}
            >
              <Badge
                label={`Day ${currentDay}`}
                variant="secondary"
                size="sm"
              />
              <Text style={styles.lessonTitle}>{todayLesson.title}</Text>
              <Text style={styles.lessonSubtitle}>{todayLesson.subtitle}</Text>
              <Button
                title="Begin"
                onPress={() => router.push(`/lesson/${todayLesson.id}`)}
                variant="primary"
                fullWidth
                style={styles.lessonButton}
              />
            </Card>
          )}
        </View>

        {/* Daily Affirmation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Affirmation</Text>
          <Card variant="outlined" style={styles.affirmationCard}>
            <Text style={styles.affirmationText}>"{dailyAffirmation}"</Text>
          </Card>
        </View>
      </ScrollView>
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
  greeting: {
    ...Typography.bodyLarge,
    color: Colors.text.secondary,
  },
  title: {
    ...Typography.h1,
    color: Colors.text.primary,
  },

  // Streak card
  streakCard: {
    marginBottom: Spacing.xl,
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  streakInfo: {
    flex: 1,
  },
  streakLabel: {
    ...Typography.caption,
    color: Colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  streakValue: {
    ...Typography.h2,
    color: Colors.text.primary,
  },
  streakSubtext: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
  },

  // Sections
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h5,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },

  // Lesson card
  lessonCard: {
    gap: Spacing.sm,
  },
  lessonTitle: {
    ...Typography.h4,
    color: Colors.text.primary,
    marginTop: Spacing.sm,
  },
  lessonSubtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
  },
  lessonButton: {
    marginTop: Spacing.md,
  },

  // Locked card
  lockedCard: {
    gap: Spacing.sm,
    backgroundColor: Colors.background.secondary,
  },
  lockedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  lockedTitle: {
    ...Typography.h4,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
  },
  lockedSubtitle: {
    ...Typography.body,
    color: Colors.text.tertiary,
  },
  requirementsList: {
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.sm,
  },
  requirementText: {
    ...Typography.body,
    color: Colors.text.secondary,
  },
  requirementComplete: {
    color: Colors.status.success,
    textDecorationLine: 'line-through',
  },

  // Affirmation
  affirmationCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  affirmationText: {
    ...Typography.affirmation,
    color: Colors.text.secondary,
  },
});
