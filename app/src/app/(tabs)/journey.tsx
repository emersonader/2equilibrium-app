import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Layout, BorderRadius } from '@/constants';
import { Card, ProgressRing, Badge } from '@/components/ui';
import { useProgressStore } from '@/stores';

// Import chapter/phase data
import chaptersData from '@/data/content/chapters.json';

interface ChapterData {
  id: string;
  phaseId: string;
  number: number;
  title: string;
  subtitle: string;
  description: string;
  daysRange: { start: number; end: number };
  color: string;
  icon: string;
  quizId: string;
}

interface PhaseData {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  chapters: ChapterData[];
}

export default function JourneyScreen() {
  const router = useRouter();
  const { completedLessons, currentDay } = useProgressStore();

  const phases = chaptersData.phases as PhaseData[];

  // Determine which chapters/phases are unlocked based on progress
  const isChapterUnlocked = (chapter: ChapterData, phaseIndex: number, chapterIndex: number): boolean => {
    // First chapter of first phase is always unlocked
    if (phaseIndex === 0 && chapterIndex === 0) return true;

    // A chapter is unlocked if all lessons from the previous chapter are completed
    if (chapterIndex > 0) {
      const prevChapter = phases[phaseIndex].chapters[chapterIndex - 1];
      return areAllLessonsComplete(prevChapter);
    }

    // First chapter of a new phase: previous phase's last chapter must be complete
    if (phaseIndex > 0) {
      const prevPhase = phases[phaseIndex - 1];
      const lastChapter = prevPhase.chapters[prevPhase.chapters.length - 1];
      return areAllLessonsComplete(lastChapter);
    }

    return false;
  };

  const areAllLessonsComplete = (chapter: ChapterData): boolean => {
    for (let day = chapter.daysRange.start; day <= chapter.daysRange.end; day++) {
      if (!completedLessons.includes(`lesson_day_${day}`)) return false;
    }
    return true;
  };

  const getChapterProgress = (chapter: ChapterData): { completed: number; total: number } => {
    let completed = 0;
    const total = chapter.daysRange.end - chapter.daysRange.start + 1;
    for (let day = chapter.daysRange.start; day <= chapter.daysRange.end; day++) {
      if (completedLessons.includes(`lesson_day_${day}`)) completed++;
    }
    return { completed, total };
  };

  // Find current phase (first phase with incomplete chapters)
  let currentPhaseIndex = 0;
  for (let i = 0; i < phases.length; i++) {
    const lastChapter = phases[i].chapters[phases[i].chapters.length - 1];
    if (!areAllLessonsComplete(lastChapter)) {
      currentPhaseIndex = i;
      break;
    }
    if (i === phases.length - 1) currentPhaseIndex = i; // all complete
  }

  const totalCompleted = completedLessons.length;
  const totalLessons = 180;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Your Journey</Text>
          <Text style={styles.subtitle}>
            Phase {phases[currentPhaseIndex].number}: {phases[currentPhaseIndex].title}
          </Text>
        </View>

        {/* Overall Progress */}
        <Card variant="elevated" style={styles.progressCard}>
          <View style={styles.progressContent}>
            <ProgressRing
              progress={(totalCompleted / totalLessons) * 100}
              size={80}
              color={Colors.primary.tiffanyBlue}
            />
            <View style={styles.progressInfo}>
              <Text style={styles.progressLabel}>Overall Progress</Text>
              <Text style={styles.progressValue}>
                {totalCompleted} of {totalLessons} lessons
              </Text>
              <Badge
                label={`Phase ${phases[currentPhaseIndex].number}: ${phases[currentPhaseIndex].title}`}
                variant="secondary"
                size="sm"
              />
            </View>
          </View>
        </Card>

        {/* All Phases & Chapters */}
        {phases.map((phase, phaseIndex) => {
          const phaseUnlocked = phaseIndex === 0 || (() => {
            const prevPhase = phases[phaseIndex - 1];
            const lastCh = prevPhase.chapters[prevPhase.chapters.length - 1];
            return areAllLessonsComplete(lastCh);
          })();

          return (
            <View key={phase.id} style={styles.phaseSection}>
              {/* Phase Header */}
              <View style={styles.phaseHeader}>
                <View style={[
                  styles.phaseIcon,
                  !phaseUnlocked && styles.phaseIconLocked,
                ]}>
                  {phaseUnlocked ? (
                    <Text style={styles.phaseNumber}>{phase.number}</Text>
                  ) : (
                    <Ionicons name="lock-closed" size={16} color={Colors.text.muted} />
                  )}
                </View>
                <View style={styles.phaseInfo}>
                  <Text style={[
                    styles.phaseTitle,
                    !phaseUnlocked && styles.phaseTitleLocked,
                  ]}>
                    Phase {phase.number}: {phase.title}
                  </Text>
                  <Text style={[
                    styles.phaseSubtitle,
                    !phaseUnlocked && styles.phaseSubtitleLocked,
                  ]}>
                    {phase.subtitle}
                  </Text>
                </View>
              </View>

              {/* Chapters (show if phase is unlocked) */}
              {phaseUnlocked && phase.chapters.map((chapter, chapterIndex) => {
                const unlocked = isChapterUnlocked(chapter, phaseIndex, chapterIndex);
                const isComplete = areAllLessonsComplete(chapter);
                const progress = getChapterProgress(chapter);
                const isLast = chapterIndex === phase.chapters.length - 1;

                return (
                  <ChapterCard
                    key={chapter.id}
                    chapter={chapter}
                    isUnlocked={unlocked}
                    isComplete={isComplete}
                    progress={progress}
                    isFirst={chapterIndex === 0}
                    isLast={isLast}
                    onPress={() => {
                      if (unlocked) {
                        router.push(`/chapter/${chapter.id}`);
                      }
                    }}
                  />
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

interface ChapterCardProps {
  chapter: ChapterData;
  isUnlocked: boolean;
  isComplete: boolean;
  progress: { completed: number; total: number };
  isFirst: boolean;
  isLast: boolean;
  onPress: () => void;
}

function ChapterCard({ chapter, isUnlocked, isComplete, progress, isFirst, isLast, onPress }: ChapterCardProps) {
  const chapterColor = chapter.color || getChapterColor(chapter.number);

  return (
    <View style={styles.chapterContainer}>
      {/* Timeline connector */}
      <View style={styles.timeline}>
        {!isFirst && (
          <View
            style={[
              styles.timelineConnector,
              styles.timelineTop,
              isComplete && { backgroundColor: chapterColor },
            ]}
          />
        )}
        <View
          style={[
            styles.timelineDot,
            isComplete && { backgroundColor: chapterColor },
            !isUnlocked && styles.timelineDotLocked,
          ]}
        >
          {isComplete && (
            <Ionicons name="checkmark" size={14} color={Colors.text.inverse} />
          )}
          {!isUnlocked && (
            <Ionicons name="lock-closed" size={12} color={Colors.text.muted} />
          )}
          {!isComplete && isUnlocked && (
            <Text style={styles.timelineDotText}>{chapter.number}</Text>
          )}
        </View>
        {!isLast && (
          <View
            style={[
              styles.timelineConnector,
              styles.timelineBottom,
              isComplete && { backgroundColor: chapterColor },
            ]}
          />
        )}
      </View>

      {/* Chapter content */}
      <Pressable
        onPress={onPress}
        disabled={!isUnlocked}
        style={({ pressed }) => [
          styles.chapterCard,
          !isUnlocked && styles.chapterCardLocked,
          pressed && isUnlocked && styles.chapterCardPressed,
        ]}
      >
        <View style={styles.chapterHeader}>
          <Badge
            label={`Days ${chapter.daysRange.start}-${chapter.daysRange.end}`}
            variant={isComplete ? 'success' : 'info'}
            size="sm"
          />
          {isComplete && (
            <Badge
              label="Complete"
              variant="success"
              size="sm"
            />
          )}
        </View>
        <Text
          style={[
            styles.chapterTitle,
            !isUnlocked && styles.chapterTitleLocked,
          ]}
        >
          {chapter.title}
        </Text>
        <Text
          style={[
            styles.chapterTheme,
            !isUnlocked && styles.chapterThemeLocked,
          ]}
        >
          {chapter.subtitle}
        </Text>
        {isUnlocked && (
          <View style={styles.chapterAction}>
            {!isComplete && (
              <Text style={styles.chapterProgress}>
                {progress.completed}/{progress.total} lessons
              </Text>
            )}
            <View style={styles.chapterActionRight}>
              <Text style={[styles.chapterActionText, { color: chapterColor }]}>
                {isComplete ? 'Review' : 'Continue'}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={chapterColor}
              />
            </View>
          </View>
        )}
      </Pressable>
    </View>
  );
}

function getChapterColor(chapter: number): string {
  const colors = [
    Colors.chapter.awakening,
    Colors.chapter.nourishment,
    Colors.chapter.mindful,
    Colors.chapter.meal,
    Colors.chapter.movement,
    Colors.chapter.mindset,
  ];
  return colors[(chapter - 1) % colors.length];
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
  subtitle: {
    ...Typography.bodyLarge,
    color: Colors.text.secondary,
  },

  // Progress card
  progressCard: {
    marginBottom: Spacing.xl,
  },
  progressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  progressInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  progressLabel: {
    ...Typography.caption,
    color: Colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  progressValue: {
    ...Typography.h4,
    color: Colors.text.primary,
  },

  // Phase section
  phaseSection: {
    marginBottom: Spacing.xl,
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  phaseIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary.tiffanyBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseIconLocked: {
    backgroundColor: Colors.background.tertiary,
  },
  phaseNumber: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
  phaseInfo: {
    flex: 1,
  },
  phaseTitle: {
    ...Typography.h5,
    color: Colors.text.primary,
  },
  phaseTitleLocked: {
    color: Colors.text.muted,
  },
  phaseSubtitle: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
  },
  phaseSubtitleLocked: {
    color: Colors.text.muted,
  },

  // Chapter card
  chapterContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  timeline: {
    width: 32,
    alignItems: 'center',
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.neutral.gray200,
  },
  timelineTop: {
    marginBottom: -1,
  },
  timelineBottom: {
    marginTop: -1,
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary.tiffanyBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotLocked: {
    backgroundColor: Colors.background.tertiary,
  },
  timelineDotText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
  chapterCard: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginLeft: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.neutral.gray200,
  },
  chapterCardLocked: {
    backgroundColor: Colors.background.secondary,
    opacity: 0.7,
  },
  chapterCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  chapterHeader: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  chapterTitle: {
    ...Typography.h5,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  chapterTitleLocked: {
    color: Colors.text.muted,
  },
  chapterTheme: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
  },
  chapterThemeLocked: {
    color: Colors.text.muted,
  },
  chapterAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  chapterActionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  chapterProgress: {
    ...Typography.caption,
    color: Colors.text.muted,
  },
  chapterActionText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
});
