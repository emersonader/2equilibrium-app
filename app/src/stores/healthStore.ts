import { create } from 'zustand';
import * as healthService from '@/services/healthService';
import * as healthConnectService from '@/services/healthConnectService';
import type { HealthData } from '@/services/healthConnectService';
import type { HealthProfile, WeightHistory, UnitSystem, Gender } from '@/services/database.types';

interface HealthState {
  // Health profile
  profile: HealthProfile | null;
  weightHistory: WeightHistory[];
  isLoading: boolean;
  error: string | null;

  // Health Connect (Apple Health / Google Health Connect)
  healthConnectAvailable: boolean;
  healthConnectConnected: boolean;
  healthData: HealthData | null;
  isSyncing: boolean;

  // Actions
  loadHealthProfile: () => Promise<void>;
  loadWeightHistory: (limit?: number) => Promise<void>;
  saveProfile: (data: {
    birthDate?: string;
    gender?: Gender;
    height?: number;
    currentWeight?: number;
    goalWeight?: number;
    unitSystem?: UnitSystem;
    trackingEnabled?: boolean;
  }) => Promise<void>;
  logWeight: (weight: number, notes?: string) => Promise<void>;
  deleteWeightEntry: (entryId: string) => Promise<void>;
  resetTracking: () => Promise<void>;
  clearError: () => void;

  // Health Connect actions
  checkHealthConnectAvailability: () => Promise<void>;
  connectHealthService: () => Promise<boolean>;
  disconnectHealthService: () => Promise<void>;
  syncHealthData: () => Promise<void>;
  writeWeightToHealth: (weightKg: number) => Promise<boolean>;
}

export const useHealthStore = create<HealthState>((set, get) => ({
  profile: null,
  weightHistory: [],
  isLoading: false,
  error: null,

  // Health Connect state
  healthConnectAvailable: false,
  healthConnectConnected: false,
  healthData: null,
  isSyncing: false,

  loadHealthProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const profile = await healthService.getHealthProfile();
      set({ profile, isLoading: false });
    } catch (error: any) {
      console.error('Failed to load health profile:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  loadWeightHistory: async (limit?: number) => {
    try {
      const weightHistory = await healthService.getWeightHistory(limit);
      set({ weightHistory });
    } catch (error: any) {
      console.error('Failed to load weight history:', error);
      set({ error: error.message });
    }
  },

  saveProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const profile = await healthService.saveHealthProfile(data);
      set({ profile, isLoading: false });

      // If weight was updated, also refresh weight history
      if (data.currentWeight !== undefined) {
        const weightHistory = await healthService.getWeightHistory(30);
        set({ weightHistory });
      }
    } catch (error: any) {
      console.error('Failed to save health profile:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  logWeight: async (weight: number, notes?: string) => {
    const { profile } = get();
    const unitSystem = profile?.unit_system || 'metric';

    set({ isLoading: true, error: null });
    try {
      await healthService.logWeight(weight, unitSystem, notes);

      // Refresh profile and history
      const [updatedProfile, weightHistory] = await Promise.all([
        healthService.getHealthProfile(),
        healthService.getWeightHistory(30),
      ]);

      set({
        profile: updatedProfile,
        weightHistory,
        isLoading: false,
      });
    } catch (error: any) {
      console.error('Failed to log weight:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  deleteWeightEntry: async (entryId: string) => {
    try {
      await healthService.deleteWeightEntry(entryId);

      // Refresh weight history
      const weightHistory = await healthService.getWeightHistory(30);
      set({ weightHistory });
    } catch (error: any) {
      console.error('Failed to delete weight entry:', error);
      set({ error: error.message });
      throw error;
    }
  },

  resetTracking: async () => {
    set({ isLoading: true, error: null });
    try {
      await healthService.resetHealthProfile();

      // Refresh state
      const profile = await healthService.getHealthProfile();
      set({
        profile,
        weightHistory: [],
        isLoading: false,
      });
    } catch (error: any) {
      console.error('Failed to reset tracking:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  // Health Connect actions
  checkHealthConnectAvailability: async () => {
    try {
      const available = await healthConnectService.isHealthAvailable();
      const connected = await healthConnectService.isConnected();
      set({ healthConnectAvailable: available, healthConnectConnected: connected });

      // If connected, load cached data
      if (connected) {
        const cached = await healthConnectService.getCachedHealthData();
        if (cached) {
          set({ healthData: cached });
        }
      }
    } catch (error) {
      console.warn('Failed to check health connect availability:', error);
      set({ healthConnectAvailable: false, healthConnectConnected: false });
    }
  },

  connectHealthService: async () => {
    set({ isLoading: true, error: null });
    try {
      const success = await healthConnectService.connectHealth();
      set({
        healthConnectConnected: success,
        isLoading: false,
      });

      // If connected, sync data immediately
      if (success) {
        get().syncHealthData();
      }

      return success;
    } catch (error: any) {
      console.warn('Failed to connect health service:', error);
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  disconnectHealthService: async () => {
    try {
      await healthConnectService.disconnectHealth();
      set({
        healthConnectConnected: false,
        healthData: null,
      });
    } catch (error) {
      console.warn('Failed to disconnect health service:', error);
    }
  },

  syncHealthData: async () => {
    const { healthConnectConnected } = get();
    if (!healthConnectConnected) return;

    set({ isSyncing: true });
    try {
      const healthData = await healthConnectService.getTodayHealthData();
      set({ healthData, isSyncing: false });
    } catch (error) {
      console.warn('Failed to sync health data:', error);
      set({ isSyncing: false });
    }
  },

  writeWeightToHealth: async (weightKg: number) => {
    const { healthConnectConnected } = get();
    if (!healthConnectConnected) return false;

    try {
      const success = await healthConnectService.writeWeight(weightKg);
      return success;
    } catch (error) {
      console.warn('Failed to write weight to health:', error);
      return false;
    }
  },
}));

export default useHealthStore;
