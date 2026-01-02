import { create } from 'zustand';
import * as revenueCatService from '@/services/revenueCatService';
import type { SubscriptionPlan } from '@/services/database.types';
import type { PurchasesPackage, CustomerInfo } from '@/services/revenueCatService';

interface SubscriptionState {
  // State
  isInitialized: boolean;
  isLoading: boolean;
  customerInfo: CustomerInfo | null;
  packages: PurchasesPackage[];
  currentTier: SubscriptionPlan | null;
  error: string | null;

  // Actions
  initialize: (userId?: string) => Promise<void>;
  loadPackages: () => Promise<void>;
  purchase: (pkg: PurchasesPackage) => Promise<boolean>;
  restore: () => Promise<boolean>;
  logout: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  // Initial state
  isInitialized: false,
  isLoading: false,
  customerInfo: null,
  packages: [],
  currentTier: null,
  error: null,

  // Initialize RevenueCat
  initialize: async (userId?: string) => {
    // Check if RevenueCat is available (won't be in Expo Go)
    if (!revenueCatService.isAvailable()) {
      console.log('RevenueCat not available - subscription features disabled');
      set({ isInitialized: true, isLoading: false });
      return;
    }

    try {
      set({ isLoading: true, error: null });

      await revenueCatService.initializeRevenueCat(userId);

      // If we have a userId, identify the user
      if (userId) {
        const customerInfo = await revenueCatService.identifyUser(userId);
        const currentTier = await revenueCatService.getCurrentTier();
        set({ customerInfo, currentTier });
      }

      // Load packages
      await get().loadPackages();

      set({ isInitialized: true });
    } catch (error) {
      console.error('Failed to initialize subscriptions:', error);
      set({ error: error instanceof Error ? error.message : 'Initialization failed' });
    } finally {
      set({ isLoading: false });
    }
  },

  // Load available packages
  loadPackages: async () => {
    if (!revenueCatService.isAvailable()) return;

    try {
      set({ isLoading: true, error: null });
      const packages = await revenueCatService.getPackages();
      set({ packages });
    } catch (error) {
      console.error('Failed to load packages:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to load packages' });
    } finally {
      set({ isLoading: false });
    }
  },

  // Purchase a package
  purchase: async (pkg: PurchasesPackage) => {
    if (!revenueCatService.isAvailable()) return false;

    try {
      set({ isLoading: true, error: null });

      const { customerInfo } = await revenueCatService.purchasePackage(pkg);
      const currentTier = await revenueCatService.getCurrentTier();

      set({ customerInfo, currentTier });

      return true;
    } catch (error: any) {
      if (error.message === 'Purchase cancelled') {
        // User cancelled, not an error
        return false;
      }
      console.error('Failed to purchase:', error);
      set({ error: error instanceof Error ? error.message : 'Purchase failed' });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  // Restore purchases
  restore: async () => {
    if (!revenueCatService.isAvailable()) return false;

    try {
      set({ isLoading: true, error: null });

      const customerInfo = await revenueCatService.restorePurchases();
      const currentTier = await revenueCatService.getCurrentTier();

      set({ customerInfo, currentTier });

      return Object.keys(customerInfo.entitlements.active).length > 0;
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      set({ error: error instanceof Error ? error.message : 'Restore failed' });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  // Logout
  logout: async () => {
    if (!revenueCatService.isAvailable()) {
      set({ customerInfo: null, currentTier: null, isInitialized: false });
      return;
    }

    try {
      await revenueCatService.logoutUser();
      set({
        customerInfo: null,
        currentTier: null,
        isInitialized: false,
      });
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  },

  // Refresh subscription status
  refreshStatus: async () => {
    if (!revenueCatService.isAvailable()) return;

    try {
      set({ isLoading: true, error: null });

      const customerInfo = await revenueCatService.getCustomerInfo();
      const currentTier = await revenueCatService.getCurrentTier();

      set({ customerInfo, currentTier });
    } catch (error) {
      console.error('Failed to refresh status:', error);
      set({ error: error instanceof Error ? error.message : 'Refresh failed' });
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useSubscriptionStore;
