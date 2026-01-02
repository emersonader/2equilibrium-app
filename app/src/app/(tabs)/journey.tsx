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

// Phase data structure
interface Phase {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  chapters: Chapter[];
  isLocked: boolean;
}

interface Chapter {
  id: string;
  number: number;
  title: string;
  theme: string;
  daysRange: { start: number; end: number };
  isCompleted: boolean;
  isLocked: boolean;
  quizPassed: boolean;
}

// Mock data - will be replaced with store data
const PHASES: Phase[] = [
  {
    id: 'phase_1',
    number: 1,
    title: 'Foundation',
    subtitle: 'Building Your Wellness Base',
    isLocked: false,
    chapters: [
      {
        id: 'chapter_1',
        number: 1,
        title: 'Awakening Your Wellness Path',
        theme: 'Setting intentions and establishing daily rhythms',
        daysRange: { start: 1, end: 5 },
        isCompleted: false,
        isLocked: false,
        quizPassed: false,
      },
      {
        id: 'chapter_2',
        number: 2,
        title: 'Nourishment Fundamentals',
        theme: 'Understanding food as fuel and healing',
        daysRange: { start: 6, end: 10 },
        isCompleted: false,
        isLocked: true,
        quizPassed: false,
      },
      {
        id: 'chapter_3',
        number: 3,
        title: 'Mindful Eating Rituals',
        theme: 'How we eat matters as much as what we eat',
        daysRange: { start: 11, end: 15 },
        isCompleted: false,
        isLocked: true,
        quizPassed: false,
      },
      {
        id: 'chapter_4',
        number: 4,
        title: 'Meal Architecture',
        theme: 'Building balanced meals throughout the day',
        daysRange: { start: 16, end: 20 },
        isCompleted: false,
        isLocked: true,
        quizPassed: false,
      },
      {
        id: 'chapter_5',
        number: 5,
        title: 'Gentle Movement Foundations',
        theme: 'Movement as self-care, not punishment',
        daysRange: { start: 21, end: 25 },
        isCompleted: false,
        isLocked: true,
        quizPassed: false,
      },
      {
        id: 'chapter_6',
        number: 6,
        title: 'Mindset & Self-Compassion',
        theme: 'The inner work that sustains the outer changes',
        daysRange: { start: 26, end: 30 },
        isCompleted: false,
        isLocked: true,
        quizPassed: false,
      },
    ],
  },
  {
    id: 'phase_2',
    number: 2,
    title: 'Momentum',
    subtitle: 'Deepening Your Practice',
    isLocked: true,
    chapters: [],
  },
  {
    id: 'phase_3',
    number: 3,
    title: 'Mastery',
    subtitle: 'Becoming Your Own Guide',
    isLocked: true,
    chapters: [],
  },
  {
    id: 'phase_4',
    number: 4,
    title: 'Evolution',
    subtitle: 'Lifelong Wellness Integration',
    isLocked: true,
    chapters: [],
  },
];

export default function JourneyScreen() {
  const router = useRouter();
  const currentPhase = PHASES[0];
  const completedChapters = 0;
  const totalChapters = currentPhase.chapters.length;

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
          <Text style={styles.subtitle}>Phase 1: Foundation</Text>
        </View>

        {/* Overall Progress */}
        <Card variant="elevated" style={styles.progressCard}>
          <View style={styles.progressContent}>
            <ProgressRing
              progress={(completedChapters / totalChapters) * 100}
              size={80}
              color={Colors.primary.tiffanyBlue}
            />
            <View style={styles.progressInfo}>
              <Text style={styles.progressLabel}>Phase 1 Progress</Text>
              <Text style={styles.progressValue}>
                {completedChapters} of {totalChapters} chapters
              </Text>
              <Badge
                label="Foundation Phase"
                variant="secondary"
                size="sm"
              />
            </View>
          </View>
        </Card>

        {/* Chapters */}
        <View style={styles.chaptersSection}>
          <Text style={styles.sectionTitle}>Chapters</Text>
          {currentPhase.chapters.map((chapter, index) => (
            <ChapterCard
              key={chapter.id}
              chapter={chapter}
              isFirst={index === 0}
              isLast={index === currentPhase.chapters.length - 1}
              onPress={() => {
                if (!chapter.isLocked) {
                  router.push(`/chapter/${chapter.id}`);
                }
              }}
            />
          ))}
        </View>

        {/* Locked Phases */}
        <View style={styles.lockedPhasesSection}>
          <Text style={styles.sectionTitle}>Coming Up</Text>
          {PHASES.slice(1).map((phase) => (
            <Card
              key={phase.id}
              variant="outlined"
              style={styles.lockedPhaseCard}
            >
              <View style={styles.lockedPhaseContent}>
                <View style={styles.lockedIcon}>
                  <Ionicons
                    name="lock-closed"
                    size={20}
                    color={Colors.text.muted}
                  />
                </View>
                <View style={styles.lockedPhaseInfo}>
                  <Text style={styles.lockedPhaseTitle}>
                    Phase {phase.number}: {phase.title}
                  </Text>
                  <Text style={styles.lockedPhaseSubtitle}>
                    {phase.subtitle}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface ChapterCardProps {
  chapter: Chapter;
  isFirst: boolean;
  isLast: boolean;
  onPress: () => void;
}

function ChapterCard({ chapter, isFirst, isLast, onPress }: ChapterCardProps) {
  const chapterColor = getChapterColor(chapter.number);

  return (
    <View style={styles.chapterContainer}>
      {/* Timeline connector */}
      <View style={styles.timeline}>
        {!isFirst && (
          <View
            style={[
              styles.timelineConnector,
              styles.timelineTop,
              chapter.isCompleted && { backgroundColor: chapterColor },
            ]}
          />
        )}
        <View
          style={[
            styles.timelineDot,
            chapter.isCompleted && { backgroundColor: chapterColor },
            chapter.isLocked && styles.timelineDotLocked,
          ]}
        >
          {chapter.isCompleted && (
            <Ionicons name="checkmark" size={14} color={Colors.text.inverse} />
          )}
          {chapter.isLocked && (
            <Ionicons name="lock-closed" size={12} color={Colors.text.muted} />
          )}
          {!chapter.isCompleted && !chapter.isLocked && (
            <Text style={styles.timelineDotText}>{chapter.number}</Text>
          )}
        </View>
        {!isLast && (
          <View
            style={[
              styles.timelineConnector,
              styles.timelineBottom,
              chapter.isCompleted && { backgroundColor: chapterColor },
            ]}
          />
        )}
      </View>

      {/* Chapter content */}
      <Pressable
        onPress={onPress}
        disabled={chapter.isLocked}
        style={({ pressed }) => [
          styles.chapterCard,
          chapter.isLocked && styles.chapterCardLocked,
          pressed && !chapter.isLocked && styles.chapterCardPressed,
        ]}
      >
        <View style={styles.chapterHeader}>
          <Badge
            label={`Days ${chapter.daysRange.start}-${chapter.daysRange.end}`}
            variant={chapter.isCompleted ? 'success' : 'info'}
            size="sm"
          />
          {chapter.quizPassed && (
            <Badge
              label="Quiz Passed"
              variant="success"
              size="sm"
            />
          )}
        </View>
        <Text
          style={[
            styles.chapterTitle,
            chapter.isLocked && styles.chapterTitleLocked,
          ]}
        >
          {chapter.title}
        </Text>
        <Text
          style={[
            styles.chapterTheme,
            chapter.isLocked && styles.chapterThemeLocked,
          ]}
        >
          {chapter.theme}
        </Text>
        {!chapter.isLocked && (
          <View style={styles.chapterAction}>
            <Text style={[styles.chapterActionText, { color: chapterColor }]}>
              {chapter.isCompleted ? 'Review' : 'Continue'}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={chapterColor}
            />
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

  // Chapters section
  chaptersSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h5,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
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
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  chapterActionText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },

  // Locked phases
  lockedPhasesSection: {
    marginTop: Spacing.xl,
  },
  lockedPhaseCard: {
    marginBottom: Spacing.md,
  },
  lockedPhaseContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  lockedIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedPhaseInfo: {
    flex: 1,
  },
  lockedPhaseTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  lockedPhaseSubtitle: {
    ...Typography.bodySmall,
    color: Colors.text.muted,
  },
});
