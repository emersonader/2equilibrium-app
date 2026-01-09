import { create } from 'zustand';
import * as badgeService from '@/services/badgeService';
import type { Badge, BadgeWithEarnedStatus, UserBadge } from '@/services/database.types';

interface BadgeState {
  // All available badges with earned status
  badges: BadgeWithEarnedStatus[];

  // Recently earned badges (for notifications)
  recentBadges: UserBadge[];

  // Newly earned badge (for showing unlock modal)
  newlyEarnedBadge: Badge | null;

  // Badge statistics
  stats: {
    totalBadges: number;
    totalAvailable: number;
    commonBadges: number;
    rareBadges: number;
    epicBadges: number;
    legendaryBadges: number;
  };

  // Loading state
  isLoading: boolean;
  error: string | null;

  // Actions
  loadBadges: () => Promise<void>;
  loadStats: () => Promise<void>;
  checkAndAwardBadges: (context: {
    lessonCompleted?: string;
    journalCount?: number;
    currentStreak?: number;
    quizScore?: number;
    chapterCompleted?: number;
    completedLessonsCount?: number;
    completionTime?: Date;
  }) => Promise<Badge[]>;
  clearNewlyEarnedBadge: () => void;
  getBadgesByCategory: (category: string) => BadgeWithEarnedStatus[];
  getEarnedBadges: () => BadgeWithEarnedStatus[];
  getUnearnedBadges: () => BadgeWithEarnedStatus[];
}

export const useBadgeStore = create<BadgeState>((set, get) => ({
  // Initial state
  badges: [],
  recentBadges: [],
  newlyEarnedBadge: null,
  stats: {
    totalBadges: 0,
    totalAvailable: 0,
    commonBadges: 0,
    rareBadges: 0,
    epicBadges: 0,
    legendaryBadges: 0,
  },
  isLoading: false,
  error: null,

  // Load all badges with earned status
  loadBadges: async () => {
    try {
      set({ isLoading: true, error: null });

      const [badges, recentBadges] = await Promise.all([
        badgeService.getBadgesWithStatus(),
        badgeService.getRecentBadges(5),
      ]);

      set({
        badges,
        recentBadges,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load badges:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load badges',
        isLoading: false,
      });
    }
  },

  // Load badge statistics
  loadStats: async () => {
    try {
      const stats = await badgeService.getBadgeStats();
      set({ stats });
    } catch (error) {
      console.error('Failed to load badge stats:', error);
    }
  },

  // Check and award badges based on context
  checkAndAwardBadges: async (context) => {
    try {
      const newBadges = await badgeService.checkAndAwardBadges(context);

      if (newBadges.length > 0) {
        // Set the first newly earned badge for the modal
        set({ newlyEarnedBadge: newBadges[0] });

        // Refresh badges and stats
        await get().loadBadges();
        await get().loadStats();
      }

      return newBadges;
    } catch (error) {
      console.error('Failed to check badges:', error);
      return [];
    }
  },

  // Clear the newly earned badge (after modal is dismissed)
  clearNewlyEarnedBadge: () => {
    set({ newlyEarnedBadge: null });
  },

  // Get badges filtered by category
  getBadgesByCategory: (category: string) => {
    return get().badges.filter(b => b.category === category);
  },

  // Get only earned badges
  getEarnedBadges: () => {
    return get().badges.filter(b => b.earned);
  },

  // Get only unearned badges
  getUnearnedBadges: () => {
    return get().badges.filter(b => !b.earned);
  },
}));

// Selector hooks for common patterns
export const useBadges = () => useBadgeStore(state => state.badges);
export const useEarnedBadges = () => useBadgeStore(state => state.badges.filter(b => b.earned));
export const useBadgeStats = () => useBadgeStore(state => state.stats);
export const useNewlyEarnedBadge = () => useBadgeStore(state => state.newlyEarnedBadge);
