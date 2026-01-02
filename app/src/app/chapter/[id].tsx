import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { ChapterBadge } from '@/components/ui/Badge';
import { useProgress } from '@/hooks/useProgress';
import phasesData from '@/data/content/chapters.json';
import lessonsData from '@/data/content/lessons.json';

// Extract all chapters from all phases
const allChapters = phasesData.phases.flatMap((phase) => phase.chapters);

export default function ChapterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { completedLessons, canAccessLesson, getChapterProgress } = useProgress();

  // Get chapter data
  const chapter = useMemo(
    () => allChapters.find((c) => c.id === id),
    [id]
  );

  // Get lessons for this chapter
  const lessons = useMemo(
    () => lessonsData.lessons.filter((l) => l.chapterId === id),
    [id]
  );

  // Get chapter progress
  const progress = useMemo(
    () => getChapterProgress(id),
    [id, getChapterProgress]
  );

  if (!chapter) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Chapter not found</Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  // Use chapter color directly from JSON (already a hex color string)
  const chapterColor = chapter.color || Colors.primary.orange;

  const allLessonsComplete = progress.lessonsCompleted === progress.totalLessons;
  const canTakeQuiz = allLessonsComplete && progress.isUnlocked;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: chapterColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.neutral.white} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <View style={styles.chapterBadge}>
            <ChapterBadge
              chapterNumber={chapter.number}
              title={chapter.title}
              completed={progress.quizPassed}
            />
          </View>

          <Text style={styles.chapterNumber}>Chapter {chapter.number}</Text>
          <Text style={styles.chapterTitle}>{chapter.title}</Text>
          <Text style={styles.chapterSubtitle}>{chapter.subtitle}</Text>

          {/* Progress Ring */}
          <View style={styles.progressContainer}>
            <ProgressRing
              progress={progress.progressPercent}
              size={80}
              strokeWidth={6}
              color={Colors.neutral.white}
              backgroundColor="rgba(255,255,255,0.3)"
            />
            <Text style={styles.progressText}>
              {progress.lessonsCompleted}/{progress.totalLessons} lessons
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Lessons List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Lessons</Text>

          {lessons.map((lesson, index) => {
            const isCompleted = completedLessons.includes(lesson.id);
            const isAccessible = canAccessLesson(lesson.dayNumber);
            const isLocked = !isAccessible;

            return (
              <TouchableOpacity
                key={lesson.id}
                style={[styles.lessonItem, isLocked && styles.lessonItemLocked]}
                onPress={() =>
                  isAccessible &&
                  router.push({
                    pathname: '/lesson/[id]',
                    params: { id: lesson.id },
                  })
                }
                disabled={isLocked}
              >
                <View
                  style={[
                    styles.lessonIndicator,
                    isCompleted && styles.lessonIndicatorCompleted,
                    isLocked && styles.lessonIndicatorLocked,
                  ]}
                >
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={16} color={Colors.neutral.white} />
                  ) : isLocked ? (
                    <Ionicons name="lock-closed" size={14} color={Colors.text.muted} />
                  ) : (
                    <Text style={styles.lessonDay}>{lesson.dayNumber}</Text>
                  )}
                </View>

                <View style={styles.lessonContent}>
                  <Text
                    style={[styles.lessonTitle, isLocked && styles.lessonTitleLocked]}
                  >
                    {lesson.title}
                  </Text>
                  <Text
                    style={[styles.lessonSubtitle, isLocked && styles.lessonSubtitleLocked]}
                  >
                    Day {lesson.dayNumber}
                  </Text>
                </View>

                {!isLocked && (
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={Colors.text.muted}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Quiz Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chapter Quiz</Text>

          <Card
            style={[
              styles.quizCard,
              progress.quizPassed ? styles.quizCardPassed : undefined,
            ]}
          >
            <View style={styles.quizHeader}>
              <View
                style={[
                  styles.quizIcon,
                  canTakeQuiz && styles.quizIconReady,
                  progress.quizPassed && styles.quizIconPassed,
                ]}
              >
                <Ionicons
                  name={progress.quizPassed ? 'trophy' : 'school-outline'}
                  size={24}
                  color={
                    progress.quizPassed
                      ? Colors.neutral.white
                      : canTakeQuiz
                      ? Colors.primary.orange
                      : Colors.text.muted
                  }
                />
              </View>

              <View style={styles.quizInfo}>
                <Text style={styles.quizTitle}>
                  {progress.quizPassed ? 'Quiz Passed!' : 'Chapter Quiz'}
                </Text>
                <Text style={styles.quizSubtitle}>
                  {progress.quizPassed
                    ? `Score: ${progress.quizPassed ? '70%+' : ''}`
                    : allLessonsComplete
                    ? 'Ready to test your knowledge'
                    : `Complete all ${progress.totalLessons} lessons first`}
                </Text>
              </View>
            </View>

            {!progress.quizPassed && (
              <Button
                title={canTakeQuiz ? 'Take Quiz' : 'Locked'}
                variant={canTakeQuiz ? 'primary' : 'ghost'}
                disabled={!canTakeQuiz}
                onPress={() =>
                  router.push({
                    pathname: '/quiz/[chapterId]',
                    params: { chapterId: id },
                  })
                }
                style={styles.quizButton}
              />
            )}

            {progress.quizPassed && (
              <View style={styles.quizPassedBadge}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={Colors.status.success}
                />
                <Text style={styles.quizPassedText}>Completed</Text>
              </View>
            )}
          </Card>
        </View>

        {/* Next Chapter Hint */}
        {progress.quizPassed && chapter.number < 6 && (
          <Card style={styles.nextChapterCard}>
            <Ionicons
              name="arrow-forward-circle"
              size={32}
              color={Colors.primary.tiffanyBlue}
            />
            <View style={styles.nextChapterInfo}>
              <Text style={styles.nextChapterTitle}>Next Chapter Unlocked</Text>
              <Text style={styles.nextChapterSubtitle}>
                Continue your journey to Chapter {chapter.number + 1}
              </Text>
            </View>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.layout.screenPadding,
  },
  errorText: {
    ...Typography.textStyles.body,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  header: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.layout.screenPadding,
  },
  backButton: {
    padding: Spacing.xs,
    marginBottom: Spacing.md,
  },
  headerContent: {
    alignItems: 'center',
  },
  chapterBadge: {
    marginBottom: Spacing.md,
  },
  chapterNumber: {
    ...Typography.textStyles.caption,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chapterTitle: {
    ...Typography.textStyles.h2,
    color: Colors.neutral.white,
    textAlign: 'center',
  },
  chapterSubtitle: {
    ...Typography.textStyles.body,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: Spacing.xxs,
  },
  progressContainer: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  progressText: {
    ...Typography.textStyles.caption,
    color: Colors.neutral.white,
    marginTop: Spacing.sm,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.layout.screenPadding,
    paddingBottom: Spacing.xxxl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.textStyles.h5,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.tertiary,
  },
  lessonItemLocked: {
    opacity: 0.6,
  },
  lessonIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  lessonIndicatorCompleted: {
    backgroundColor: Colors.status.success,
  },
  lessonIndicatorLocked: {
    backgroundColor: Colors.background.tertiary,
  },
  lessonDay: {
    ...Typography.textStyles.caption,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  lessonContent: {
    flex: 1,
  },
  lessonTitle: {
    ...Typography.textStyles.body,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  lessonTitleLocked: {
    color: Colors.text.muted,
  },
  lessonSubtitle: {
    ...Typography.textStyles.caption,
    color: Colors.text.secondary,
  },
  lessonSubtitleLocked: {
    color: Colors.text.muted,
  },
  quizCard: {
    padding: Spacing.lg,
  },
  quizCardPassed: {
    borderWidth: 2,
    borderColor: Colors.status.success,
  },
  quizHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  quizIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  quizIconReady: {
    backgroundColor: Colors.primary.orangeLight,
  },
  quizIconPassed: {
    backgroundColor: Colors.status.success,
  },
  quizInfo: {
    flex: 1,
  },
  quizTitle: {
    ...Typography.textStyles.h5,
    color: Colors.text.primary,
  },
  quizSubtitle: {
    ...Typography.textStyles.caption,
    color: Colors.text.secondary,
    marginTop: Spacing.xxs,
  },
  quizButton: {
    marginTop: Spacing.sm,
  },
  quizPassedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.sm,
  },
  quizPassedText: {
    ...Typography.textStyles.body,
    color: Colors.status.success,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  nextChapterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.primary.tiffanyBlueLight,
  },
  nextChapterInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  nextChapterTitle: {
    ...Typography.textStyles.body,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  nextChapterSubtitle: {
    ...Typography.textStyles.caption,
    color: Colors.text.secondary,
  },
});
