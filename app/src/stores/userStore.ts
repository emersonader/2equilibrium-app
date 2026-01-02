import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '@/services/supabase';
import type { Profile, Subscription, UserProgress } from '@/services/database.types';
import * as authService from '@/services/authService';
import * as subscriptionService from '@/services/subscriptionService';
import * as progressService from '@/services/progressService';

interface UserState {
  // Auth state
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;

  // User data
  profile: Profile | null;
  subscription: Subscription | null;
  progress: UserProgress | null;

  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  refreshProgress: () => Promise<void>;
  refreshAll: () => Promise<void>;
  updateOnboardingComplete: () => Promise<void>;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      isLoading: true,
      userId: null,
      profile: null,
      subscription: null,
      progress: null,

      // Initialize - check for existing session
      initialize: async () => {
        try {
          set({ isLoading: true });

          if (!supabase) {
            console.log('Supabase not configured, skipping auth check');
            set({ isAuthenticated: false, userId: null });
            return;
          }

          const { data: { session } } = await supabase.auth.getSession();

          if (session?.user) {
            set({ isAuthenticated: true, userId: session.user.id });
            await get().refreshAll();
          } else {
            set({ isAuthenticated: false, userId: null });
          }
        } catch (error) {
          console.error('Failed to initialize user:', error);
          set({ isAuthenticated: false, userId: null });
        } finally {
          set({ isLoading: false });
        }
      },

      // Sign in
      signIn: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const { user } = await authService.signIn({ email, password });

          if (user) {
            set({ isAuthenticated: true, userId: user.id, isLoading: false });
            // Refresh data in background - don't wait for it
            get().refreshAll().catch(console.error);
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // Sign up
      signUp: async (email: string, password: string, fullName?: string) => {
        set({ isLoading: true });
        try {
          const { user } = await authService.signUp({ email, password, fullName });

          if (user) {
            set({ isAuthenticated: true, userId: user.id, isLoading: false });
            // Refresh data in background - don't wait for it
            get().refreshAll().catch(console.error);
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // Sign out
      signOut: async () => {
        set({ isLoading: true });
        try {
          await authService.signOut();
          set({
            isAuthenticated: false,
            userId: null,
            profile: null,
            subscription: null,
            progress: null,
          });
        } finally {
          set({ isLoading: false });
        }
      },

      // Refresh profile
      refreshProfile: async () => {
        try {
          const profile = await authService.getProfile();
          set({ profile });
        } catch (error) {
          console.error('Failed to refresh profile:', error);
        }
      },

      // Refresh subscription
      refreshSubscription: async () => {
        try {
          const subscription = await subscriptionService.getSubscription();
          set({ subscription });
        } catch (error) {
          console.error('Failed to refresh subscription:', error);
        }
      },

      // Refresh progress
      refreshProgress: async () => {
        try {
          const progress = await progressService.getUserProgress();
          set({ progress });
        } catch (error) {
          console.error('Failed to refresh progress:', error);
        }
      },

      // Refresh all user data
      refreshAll: async () => {
        try {
          await Promise.all([
            get().refreshProfile(),
            get().refreshSubscription(),
            get().refreshProgress(),
          ]);
        } catch (error) {
          console.error('Error refreshing user data:', error);
          // Don't throw - let user continue even if refresh fails
        }
      },

      // Update onboarding complete
      updateOnboardingComplete: async () => {
        try {
          await authService.updateProfile({ onboardingCompleted: true });
          await get().refreshProfile();
        } catch (error) {
          console.error('Failed to update onboarding:', error);
        }
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist these fields
        isAuthenticated: state.isAuthenticated,
        userId: state.userId,
      }),
    }
  )
);

// Set up auth state listener (only if Supabase is configured)
if (isSupabaseConfigured && supabase) {
  supabase.auth.onAuthStateChange(async (event, session) => {
    const store = useUserStore.getState();

    if (event === 'SIGNED_IN' && session?.user) {
      useUserStore.setState({
        isAuthenticated: true,
        userId: session.user.id,
      });
      await store.refreshAll();
    } else if (event === 'SIGNED_OUT') {
      useUserStore.setState({
        isAuthenticated: false,
        userId: null,
        profile: null,
        subscription: null,
        progress: null,
      });
    } else if (event === 'TOKEN_REFRESHED') {
      // Session refreshed, data should still be valid
    }
  });
}

export default useUserStore;
