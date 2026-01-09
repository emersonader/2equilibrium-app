import { create } from 'zustand';
import * as journalService from '@/services/journalService';
import { useBadgeStore } from './badgeStore';
import type { JournalEntry } from '@/services/database.types';
import type { JournalEntryData } from '@/services/journalService';

interface JournalState {
  // Current entry state
  todayEntry: JournalEntry | null;
  recentEntries: JournalEntry[];
  isLoading: boolean;

  // Weekly summary
  weeklySummary: {
    totalEntries: number;
    averageMood: number | null;
    averageEnergy: number | null;
    movementDays: number;
    totalWaterIntake: number;
  } | null;

  // Mood trend
  moodTrend: Array<{ date: string; mood: number | null }>;

  // Actions
  loadTodayEntry: () => Promise<void>;
  loadRecentEntries: (limit?: number) => Promise<void>;
  saveEntry: (data: JournalEntryData) => Promise<JournalEntry>;
  loadWeeklySummary: () => Promise<void>;
  loadMoodTrend: (days?: number) => Promise<void>;
  deleteEntry: (entryId: string) => Promise<void>;
  exportJournal: (format: 'json' | 'csv') => Promise<string>;
}

export const useJournalStore = create<JournalState>((set, get) => ({
  // Initial state
  todayEntry: null,
  recentEntries: [],
  isLoading: false,
  weeklySummary: null,
  moodTrend: [],

  // Load today's entry
  loadTodayEntry: async () => {
    try {
      set({ isLoading: true });
      const entry = await journalService.getTodayEntry();
      set({ todayEntry: entry });
    } catch (error) {
      console.error('Failed to load today entry:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Load recent entries
  loadRecentEntries: async (limit = 7) => {
    try {
      set({ isLoading: true });
      const entries = await journalService.getRecentEntries(limit);
      set({ recentEntries: entries });
    } catch (error) {
      console.error('Failed to load recent entries:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Save journal entry
  saveEntry: async (data: JournalEntryData) => {
    try {
      set({ isLoading: true });
      const entry = await journalService.saveJournalEntry(data);

      // Update today's entry if it's today (use local date)
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      if (entry.entry_date === today) {
        set({ todayEntry: entry });
      }

      // Refresh recent entries
      await get().loadRecentEntries();

      // Check and award journal badges
      const allEntries = await journalService.getAllEntries();
      const badgeStore = useBadgeStore.getState();
      await badgeStore.checkAndAwardBadges({
        journalCount: allEntries.length,
      });

      return entry;
    } catch (error) {
      console.error('Failed to save entry:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Load weekly summary
  loadWeeklySummary: async () => {
    try {
      // Get the start of the current week (Sunday)
      const today = new Date();
      const dayOfWeek = today.getDay();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - dayOfWeek);
      const weekStartDate = weekStart.toISOString().split('T')[0];

      const summary = await journalService.getWeeklySummary(weekStartDate);
      set({ weeklySummary: summary });
    } catch (error) {
      console.error('Failed to load weekly summary:', error);
    }
  },

  // Load mood trend
  loadMoodTrend: async (days = 14) => {
    try {
      const trend = await journalService.getMoodTrend(days);
      set({ moodTrend: trend });
    } catch (error) {
      console.error('Failed to load mood trend:', error);
    }
  },

  // Delete entry
  deleteEntry: async (entryId: string) => {
    try {
      await journalService.deleteEntry(entryId);

      // Clear today's entry if deleted
      const { todayEntry } = get();
      if (todayEntry?.id === entryId) {
        set({ todayEntry: null });
      }

      // Refresh recent entries
      await get().loadRecentEntries();
    } catch (error) {
      console.error('Failed to delete entry:', error);
      throw error;
    }
  },

  // Export journal
  exportJournal: async (format: 'json' | 'csv') => {
    try {
      if (format === 'json') {
        return await journalService.exportJournalAsJson();
      } else {
        return await journalService.exportJournalAsCsv();
      }
    } catch (error) {
      console.error('Failed to export journal:', error);
      throw error;
    }
  },
}));

export default useJournalStore;
