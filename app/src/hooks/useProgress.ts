import { useCallback, useMemo } from 'react';
import { useProgressStore } from '@/stores/progressStore';
import { useUserStore } from '@/stores/userStore';
import * as progressService from '@/services/progressService';
import * as journalService from '@/services/journalService';
import phasesData from '@/data/content/chapters.json';
import lessonsData from '@/data/content/lessons.json';

// Extract all chapters from all phases
const allChapters = phasesData.phases.flatMap((phase) => phase.chapters);

interface ChapterProgress {
  id: string;
  isUnlocked: boolean;
  isComplete: boolean;
  quizPassed: boolean;
  lessonsCompleted: number;
  totalLessons: number;
  progressPercent: number;
}

/**
 * Hook for progress tracking and lesson access
 */
export function useProgress() {
  const { completedLessons, currentDay, quizScores, currentStreak, longestStreak } =
    useProgressStore();
  const { progress } = useUserStore();

  // Calculate unlocked day based on subscription start
  const unlockedDay = useMemo(() => {
    if (!progress?.subscription_start_date) return 1;
    return progressService.calculateUnlockedDay(new Date(progress.subscription_start_date));
  }, [progress?.subscription_start_date]);

  // Basic check if a specific lesson is accessible (sync, doesn't check journal/movement)
  const canAccessLessonBasic = useCallback(
    (lessonDayNumber: number): boolean => {
      // Day 1 is always accessible
      if (lessonDayNumber === 1) return true;

      // For other days, check if previous lesson is completed
      // User can access day N if they've completed day N-1
      const previousLessonId = `lesson_day_${lessonDayNumber - 1}`;
      const isPreviousCompleted = completedLessons.includes(previousLessonId);

      // If previous lesson is not completed, this lesson is locked
      if (!isPreviousCompleted) return false;

      // Find which chapter this lesson belongs to
      const lesson = lessonsData.lessons.find((l) => l.dayNumber === lessonDayNumber);
      if (!lesson) return false;

      // Find the chapter
      const chapter = allChapters.find((c) => c.id === lesson.chapterId);
      if (!chapter) return false;

      // First chapter is always accessible (already passed previous lesson check)
      if (chapter.number === 1) return true;

      // Check if previous chapter's quiz is passed
      const prevChapter = allChapters.find((c) => c.number === chapter.number - 1);
      if (prevChapter) {
        const prevQuizScore = quizScores[prevChapter.id];
        if (!prevQuizScore || prevQuizScore < 70) {
          return false;
        }
      }

      return true;
    },
    [completedLessons, quizScores]
  );

  // Full check if lesson is accessible (async, checks journal/movement completion)
  const canAccessLessonFull = useCallback(
    async (lessonDayNumber: number): Promise<{
      canAccess: boolean;
      reason?: string;
      previousLessonStatus?: {
        journalComplete: boolean;
        movementComplete: boolean;
      };
    }> => {
      return progressService.canAccessLesson(lessonDayNumber);
    },
    []
  );

  // Check if a lesson is fully complete (journal + movement)
  const isLessonFullyComplete = useCallback(
    async (lessonId: string) => {
      return journalService.isLessonFullyComplete(lessonId);
    },
    []
  );

  // Legacy: keep canAccessLesson as alias for basic check
  const canAccessLesson = canAccessLessonBasic;

  // Get progress for a specific chapter
  const getChapterProgress = useCallback(
    (chapterId: string): ChapterProgress => {
      const chapter = allChapters.find((c) => c.id === chapterId);
      if (!chapter) {
        return {
          id: chapterId,
          isUnlocked: false,
          isComplete: false,
          quizPassed: false,
          lessonsCompleted: 0,
          totalLessons: 0,
          progressPercent: 0,
        };
      }

      // Get lessons for this chapter
      const chapterLessons = lessonsData.lessons.filter((l) => l.chapterId === chapterId);
      const totalLessons = chapterLessons.length;

      // Count completed lessons
      const lessonsCompleted = chapterLessons.filter((l) =>
        completedLessons.includes(l.id)
      ).length;

      // Check if chapter is unlocked (first chapter always, others need prev quiz)
      let isUnlocked = chapter.number === 1;
      if (chapter.number > 1) {
        const prevChapter = allChapters.find((c) => c.number === chapter.number - 1);
        if (prevChapter) {
          const prevQuizScore = quizScores[prevChapter.id];
          isUnlocked = prevQuizScore !== undefined && prevQuizScore >= 70;
        }
      }

      // Check if quiz is passed
      const quizScore = quizScores[chapterId];
      const quizPassed = quizScore !== undefined && quizScore >= 70;

      // Chapter is complete if all lessons done AND quiz passed
      const isComplete = lessonsCompleted === totalLessons && quizPassed;

      const progressPercent = totalLessons > 0 ? (lessonsCompleted / totalLessons) * 100 : 0;

      return {
        id: chapterId,
        isUnlocked,
        isComplete,
        quizPassed,
        lessonsCompleted,
        totalLessons,
        progressPercent,
      };
    },
    [completedLessons, quizScores]
  );

  // Get all chapters progress
  const allChaptersProgress = useMemo(() => {
    return allChapters.map((chapter) => getChapterProgress(chapter.id));
  }, [getChapterProgress]);

  // Overall progress stats
  const overallProgress = useMemo(() => {
    const totalLessons = lessonsData.lessons.length;
    const completedCount = completedLessons.length;
    const totalChapters = allChapters.length;
    const completedChapters = allChaptersProgress.filter((c) => c.isComplete).length;

    return {
      lessonsCompleted: completedCount,
      totalLessons,
      lessonsPercent: totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0,
      chaptersCompleted: completedChapters,
      totalChapters,
      chaptersPercent: totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0,
    };
  }, [completedLessons, allChaptersProgress]);

  // Get today's lesson
  const todaysLesson = useMemo(() => {
    return lessonsData.lessons.find((l) => l.dayNumber === currentDay);
  }, [currentDay]);

  // Check if today's lesson is completed
  const isTodayComplete = useMemo(() => {
    if (!todaysLesson) return false;
    return completedLessons.includes(todaysLesson.id);
  }, [todaysLesson, completedLessons]);

  return {
    completedLessons,
    currentDay,
    unlockedDay,
    currentStreak,
    longestStreak,
    canAccessLesson,
    canAccessLessonBasic,
    canAccessLessonFull,
    isLessonFullyComplete,
    getChapterProgress,
    allChaptersProgress,
    overallProgress,
    todaysLesson,
    isTodayComplete,
  };
}

/**
 * Hook for progress actions
 */
export function useProgressActions() {
  const { markLessonComplete, submitQuiz, loadQuizAttempts, refreshFromServer } =
    useProgressStore();

  return {
    markLessonComplete,
    submitQuiz,
    loadQuizAttempts,
    refreshFromServer,
  };
}

export default useProgress;
