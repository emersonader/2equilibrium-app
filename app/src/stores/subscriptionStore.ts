import { create } from 'zustand';
import { Platform } from 'react-native';
import * as subscriptionService from '@/services/subscriptionService';
import * as iapService from '@/services/iapService';
import type { SubscriptionTier } from '@/constants/featureFlags';
import type { Subscription } from '@/services/database.types';

// App-level subscription status (separate from DB SubscriptionStatus)
export type AppSubscriptionStatus = 'none' | 'active' | 'completed' | 'expired';

function deriveStatus(subscription: Subscription | null): AppSubscriptionStatus {
  if (!subscription) return 'none';

  if (subscription.status === 'active' || subscription.status === 'trial') {
    return 'active';
  }

  if (subscription.status === 'completed') {
    const recapExpiry = subscription.recap_expires_at
      ? new Date(subscription.recap_expires_at)
      : null;
    if (recapExpiry && recapExpiry > new Date()) return 'completed'; // in 60-day recap window
    return 'expired';
  }

  return 'none';
}

function deriveTier(status: AppSubscriptionStatus, hasIAP: boolean = false): SubscriptionTier {
  return status === 'active' || status === 'completed' || hasIAP ? 'subscribed' : 'none';
}

interface SubscriptionState {
  // State
  isInitialized: boolean;
  isLoading: boolean;
  subscription: Subscription | null;
  subscriptionStatus: AppSubscriptionStatus;
  currentTier: SubscriptionTier;
  recapDaysRemaining: number;
  error: string | null;
  
  // IAP State
  hasIAP: boolean;
  iapAvailable: boolean;
  iapProduct: any | null; // ProductOrSubscription type
  isPurchasing: boolean;

  // Actions
  initialize: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  restore: () => Promise<boolean>;
  logout: () => void;
  
  // IAP Actions
  initIAP: () => Promise<void>;
  purchaseViaIAP: () => Promise<boolean>;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  // Initial state
  isInitialized: false,
  isLoading: false,
  subscription: null,
  subscriptionStatus: 'none',
  currentTier: 'none',
  recapDaysRemaining: 0,
  error: null,
  
  // IAP initial state
  hasIAP: false,
  iapAvailable: false,
  iapProduct: null,
  isPurchasing: false,

  // Initialize: load subscription status from Supabase AND check IAP
  initialize: async () => {
    try {
      set({ isLoading: true, error: null });

      // Initialize IAP in parallel
      await get().initIAP();

      const subscription = await subscriptionService.getSubscription();
      const status = deriveStatus(subscription);
      const { hasIAP } = get();
      const tier = deriveTier(status, hasIAP);

      let recapDaysRemaining = 0;
      if (status === 'completed' && subscription?.recap_expires_at) {
        const expiry = new Date(subscription.recap_expires_at);
        const diffMs = expiry.getTime() - Date.now();
        recapDaysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      }

      set({
        subscription,
        subscriptionStatus: status,
        currentTier: tier,
        recapDaysRemaining,
        isInitialized: true,
      });
    } catch (error) {
      console.error('Failed to initialize subscription:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load subscription',
        isInitialized: true,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  // Refresh subscription status from Supabase AND check IAP
  refreshStatus: async () => {
    try {
      set({ isLoading: true, error: null });

      // Check IAP status
      let hasIAP = false;
      if (Platform.OS === 'ios' && get().iapAvailable) {
        hasIAP = await iapService.checkActiveSubscription();
        set({ hasIAP });
      }

      const subscription = await subscriptionService.getSubscription();
      const status = deriveStatus(subscription);
      const tier = deriveTier(status, hasIAP);

      let recapDaysRemaining = 0;
      if (status === 'completed' && subscription?.recap_expires_at) {
        const expiry = new Date(subscription.recap_expires_at);
        const diffMs = expiry.getTime() - Date.now();
        recapDaysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      }

      set({ subscription, subscriptionStatus: status, currentTier: tier, recapDaysRemaining });
    } catch (error) {
      console.error('Failed to refresh subscription:', error);
      set({ error: error instanceof Error ? error.message : 'Refresh failed' });
    } finally {
      set({ isLoading: false });
    }
  },

  // Restore: re-check Supabase (Stripe webhook should have updated it) and IAP
  restore: async () => {
    await get().refreshStatus();
    const { subscriptionStatus, hasIAP } = get();
    return subscriptionStatus === 'active' || subscriptionStatus === 'completed' || hasIAP;
  },

  // Logout: clear subscription state (but keep IAP state)
  logout: () => {
    set({
      subscription: null,
      subscriptionStatus: 'none',
      currentTier: get().hasIAP ? 'subscribed' : 'none', // Keep tier if IAP active
      recapDaysRemaining: 0,
      isInitialized: false,
    });
  },

  // Initialize IAP
  initIAP: async () => {
    if (Platform.OS !== 'ios') {
      set({ iapAvailable: false });
      return;
    }

    try {
      const success = await iapService.initIAP();
      set({ iapAvailable: success });

      if (success) {
        // Set up callbacks
        iapService.setOnPurchaseSuccess(() => {
          set({ hasIAP: true, isPurchasing: false });
          get().refreshStatus(); // Recalculate tier
        });

        iapService.setOnPurchaseError(() => {
          set({ isPurchasing: false });
        });

        // Get product info
        const product = await iapService.getSubscriptionProduct();
        set({ iapProduct: product });

        // Check existing purchases
        const hasActive = await iapService.checkActiveSubscription();
        set({ hasIAP: hasActive });
      }
    } catch (error) {
      console.error('Failed to initialize IAP:', error);
      set({ iapAvailable: false });
    }
  },

  // Purchase via IAP
  purchaseViaIAP: async () => {
    const { iapAvailable, iapProduct } = get();
    
    if (!iapAvailable) {
      throw new Error('IAP not available');
    }

    if (!iapProduct) {
      throw new Error('Product not loaded');
    }

    set({ isPurchasing: true });

    try {
      await iapService.purchaseSubscription();
      // Result comes via callback
      return true;
    } catch (error) {
      set({ isPurchasing: false });
      throw error;
    }
  },
}));

export default useSubscriptionStore;
