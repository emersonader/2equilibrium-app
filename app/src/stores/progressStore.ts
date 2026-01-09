import { create } from 'zustand';
import * as progressService from '@/services/progressService';
import { useBadgeStore } from './badgeStore';
import type { QuizAttempt, Milestone } from '@/services/database.types';

interface ProgressState {
  // Lesson state
  completedLessons: string[];
  currentDay: number;

  // Quiz state
  quizAttempts: Record<string, QuizAttempt[]>; // keyed by chapterId
  quizScores: Record<string, number>; // best scores keyed by chapterId

  // Achievements
  milestones: Milestone[];
  badges: string[];

  // Streak
  currentStreak: number;
  longestStreak: number;

  // Actions
  markLessonComplete: (lessonId: string) => Promise<void>;
  submitQuiz: (chapterId: string, score: number, passed: boolean, missedTopics: string[]) => Promise<void>;
  loadQuizAttempts: (chapterId: string) => Promise<void>;
  checkMilestones: () => Promise<void>;
  refreshFromServer: () => Promise<void>;
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  // Initial state
  completedLessons: [],
  currentDay: 1,
  quizAttempts: {},
  quizScores: {},
  milestones: [],
  badges: [],
  currentStreak: 0,
  longestStreak: 0,

  // Mark lesson complete
  markLessonComplete: async (lessonId: string) => {
    try {
      const progress = await progressService.completeLesson(lessonId);

      set({
        completedLessons: progress.completed_lessons,
        currentDay: progress.current_day,
        currentStreak: progress.current_streak,
        longestStreak: progress.longest_streak,
        badges: progress.badges,
      });

      // Check for milestones after completing lesson
      await get().checkMilestones();

      // Check and award badges
      const badgeStore = useBadgeStore.getState();
      await badgeStore.checkAndAwardBadges({
        lessonCompleted: lessonId,
        completedLessonsCount: progress.completed_lessons.length,
        currentStreak: progress.current_streak,
        completionTime: new Date(),
      });
    } catch (error) {
      console.error('Failed to mark lesson complete:', error);
      throw error;
    }
  },

  // Submit quiz
  submitQuiz: async (chapterId: string, score: number, passed: boolean, missedTopics: string[]) => {
    try {
      const attempt = await progressService.recordQuizAttempt(
        chapterId,
        score,
        passed,
        missedTopics
      );

      // Update local state
      const currentAttempts = get().quizAttempts[chapterId] || [];
      set({
        quizAttempts: {
          ...get().quizAttempts,
          [chapterId]: [attempt, ...currentAttempts],
        },
      });

      // Update best score if needed
      const currentBest = get().quizScores[chapterId] || 0;
      if (score > currentBest) {
        set({
          quizScores: {
            ...get().quizScores,
            [chapterId]: score,
          },
        });
      }

      // Refresh from server to get updated progress
      await get().refreshFromServer();

      // Check for milestones
      await get().checkMilestones();

      // Check and award badges for quiz
      const badgeStore = useBadgeStore.getState();
      await badgeStore.checkAndAwardBadges({
        quizScore: score,
        chapterCompleted: passed ? parseInt(chapterId.replace('chapter_', '')) : undefined,
      });
    } catch (error) {
      console.error('Failed to submit quiz:', error);
      throw error;
    }
  },

  // Load quiz attempts for a chapter
  loadQuizAttempts: async (chapterId: string) => {
    try {
      const attempts = await progressService.getQuizAttempts(chapterId);
      const bestScore = await progressService.getBestQuizScore(chapterId);

      set({
        quizAttempts: {
          ...get().quizAttempts,
          [chapterId]: attempts,
        },
        quizScores: {
          ...get().quizScores,
          ...(bestScore !== null ? { [chapterId]: bestScore } : {}),
        },
      });
    } catch (error) {
      console.error('Failed to load quiz attempts:', error);
    }
  },

  // Check and award milestones
  checkMilestones: async () => {
    try {
      const { completedLessons, currentStreak, badges } = get();

      // Day milestones
      const dayMilestones = [
        { day: 7, type: 'day_7' },
        { day: 14, type: 'day_14' },
        { day: 30, type: 'day_30' },
        { day: 60, type: 'day_60' },
        { day: 90, type: 'day_90' },
        { day: 180, type: 'day_180' },
        { day: 365, type: 'day_365' },
      ];

      for (const milestone of dayMilestones) {
        if (completedLessons.length >= milestone.day) {
          await progressService.recordMilestone(milestone.type);
        }
      }

      // Streak milestones
      if (currentStreak >= 7) {
        await progressService.recordMilestone('streak_7');
      }
      if (currentStreak >= 30) {
        await progressService.recordMilestone('streak_30');
      }

      // Chapter milestones (handled in quiz submission via badge)
      for (const badge of badges) {
        if (badge.includes('chapter_') && badge.includes('_complete')) {
          await progressService.recordMilestone(badge);
        }
      }

      // First journal entry milestone is handled in journal store

      // Refresh milestones from server
      const milestones = await progressService.getMilestones();
      set({ milestones });
    } catch (error) {
      console.error('Failed to check milestones:', error);
    }
  },

  // Refresh all progress from server
  refreshFromServer: async () => {
    try {
      const progress = await progressService.getUserProgress();

      if (progress) {
        set({
          completedLessons: progress.completed_lessons,
          currentDay: progress.current_day,
          currentStreak: progress.current_streak,
          longestStreak: progress.longest_streak,
          badges: progress.badges,
        });
      }

      const milestones = await progressService.getMilestones();
      set({ milestones });
    } catch (error) {
      console.error('Failed to refresh progress:', error);
    }
  },
}));

export default useProgressStore;
