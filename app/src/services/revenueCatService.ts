import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as subscriptionService from './subscriptionService';
import type { SubscriptionPlan } from './database.types';

// Lazy load RevenueCat to avoid crash in Expo Go
let Purchases: any = null;
let isRevenueCatAvailable = false;

try {
  // Check if the native module exists before loading - the JS package will
  // always resolve from node_modules, but native methods crash without the binary
  const { NativeModules } = require('react-native');
  if (!NativeModules.RNPurchases) {
    console.warn('RevenueCat native module not found (expected in Expo Go)');
  } else {
    Purchases = require('react-native-purchases').default;
    isRevenueCatAvailable = true;
  }
} catch (e) {
  console.warn('RevenueCat not available:', e);
}

// Type definitions for when module isn't available
export type PurchasesPackage = any;
export type CustomerInfo = any;
export type PurchasesOffering = any;

// RevenueCat API keys from environment
const REVENUECAT_API_KEY_IOS =
  Constants.expoConfig?.extra?.revenueCatApiKeyIos ||
  process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS ||
  '';
const REVENUECAT_API_KEY_ANDROID =
  Constants.expoConfig?.extra?.revenueCatApiKeyAndroid ||
  process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID ||
  '';

// Product identifiers (these should match RevenueCat dashboard)
export const PRODUCT_IDS = {
  foundation: 'hwj_foundation_monthly',
  transformation: 'hwj_transformation_6month',
  lifetime: 'hwj_lifetime_yearly',
} as const;

// Entitlement identifiers
export const ENTITLEMENTS = {
  premium: 'premium',
  lifetime: 'lifetime_access',
} as const;

// Offering identifier
export const OFFERING_ID = 'default';

/**
 * Check if RevenueCat is available
 */
export function isAvailable(): boolean {
  return isRevenueCatAvailable;
}

/**
 * Initialize RevenueCat SDK
 */
export async function initializeRevenueCat(userId?: string): Promise<void> {
  if (!isRevenueCatAvailable) {
    console.warn('RevenueCat not available - skipping initialization');
    return;
  }

  try {
    const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;

    if (!apiKey) {
      console.warn('RevenueCat API key not configured');
      return;
    }

    await Purchases.configure({ apiKey });

    // Log in user if we have a userId
    if (userId) {
      await Purchases.logIn(userId);
    }

    console.log('RevenueCat initialized successfully');
  } catch (error) {
    console.error('Failed to initialize RevenueCat:', error);
    // Don't throw - allow app to work without subscriptions
    isRevenueCatAvailable = false;
  }
}

/**
 * Identify user with RevenueCat
 */
export async function identifyUser(userId: string): Promise<CustomerInfo> {
  try {
    const { customerInfo } = await Purchases.logIn(userId);
    return customerInfo;
  } catch (error) {
    console.error('Failed to identify user:', error);
    throw error;
  }
}

/**
 * Log out user from RevenueCat
 */
export async function logoutUser(): Promise<CustomerInfo> {
  try {
    const customerInfo = await Purchases.logOut();
    return customerInfo;
  } catch (error) {
    console.error('Failed to logout user:', error);
    throw error;
  }
}

/**
 * Get available offerings (subscription packages)
 */
export async function getOfferings(): Promise<PurchasesOffering | null> {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current || offerings.all[OFFERING_ID] || null;
  } catch (error) {
    console.error('Failed to get offerings:', error);
    throw error;
  }
}

/**
 * Get all available packages from the current offering
 */
export async function getPackages(): Promise<PurchasesPackage[]> {
  const offering = await getOfferings();
  return offering?.availablePackages || [];
}

/**
 * Get customer info (subscription status)
 */
export async function getCustomerInfo(): Promise<CustomerInfo> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    console.error('Failed to get customer info:', error);
    throw error;
  }
}

/**
 * Check if user has active subscription
 */
export async function hasActiveSubscription(): Promise<boolean> {
  try {
    const customerInfo = await getCustomerInfo();
    return (
      typeof customerInfo.entitlements.active[ENTITLEMENTS.premium] !== 'undefined' ||
      typeof customerInfo.entitlements.active[ENTITLEMENTS.lifetime] !== 'undefined'
    );
  } catch (error) {
    console.error('Failed to check subscription:', error);
    return false;
  }
}

/**
 * Get current subscription tier based on entitlements
 */
export async function getCurrentTier(): Promise<SubscriptionPlan | null> {
  try {
    const customerInfo = await getCustomerInfo();

    // Check for lifetime first
    if (customerInfo.entitlements.active[ENTITLEMENTS.lifetime]) {
      return 'lifetime';
    }

    // Check for premium (transformation or foundation)
    const premiumEntitlement = customerInfo.entitlements.active[ENTITLEMENTS.premium];
    if (premiumEntitlement) {
      // Determine which plan based on product identifier
      const productId = premiumEntitlement.productIdentifier;
      if (productId === PRODUCT_IDS.transformation) {
        return 'transformation';
      }
      return 'foundation';
    }

    return null;
  } catch (error) {
    console.error('Failed to get current tier:', error);
    return null;
  }
}

/**
 * Purchase a package
 */
export async function purchasePackage(
  pkg: PurchasesPackage
): Promise<{ customerInfo: CustomerInfo; productIdentifier: string }> {
  try {
    const { customerInfo, productIdentifier } = await Purchases.purchasePackage(pkg);

    // Sync with our backend
    await syncSubscriptionToBackend(customerInfo);

    return { customerInfo, productIdentifier };
  } catch (error: any) {
    if (error.userCancelled) {
      throw new Error('Purchase cancelled');
    }
    console.error('Failed to purchase:', error);
    throw error;
  }
}

/**
 * Purchase a specific product by ID
 */
export async function purchaseProduct(
  productId: string
): Promise<{ customerInfo: CustomerInfo; productIdentifier: string }> {
  try {
    const packages = await getPackages();
    const pkg = packages.find((p) => p.product.identifier === productId);

    if (!pkg) {
      throw new Error(`Product not found: ${productId}`);
    }

    return purchasePackage(pkg);
  } catch (error) {
    console.error('Failed to purchase product:', error);
    throw error;
  }
}

/**
 * Restore purchases
 */
export async function restorePurchases(): Promise<CustomerInfo> {
  try {
    const customerInfo = await Purchases.restorePurchases();

    // Sync with our backend
    await syncSubscriptionToBackend(customerInfo);

    return customerInfo;
  } catch (error) {
    console.error('Failed to restore purchases:', error);
    throw error;
  }
}

/**
 * Sync RevenueCat subscription status to our backend
 */
export async function syncSubscriptionToBackend(
  customerInfo: CustomerInfo
): Promise<void> {
  try {
    const originalAppUserId = customerInfo.originalAppUserId;

    // Determine the plan
    let plan: SubscriptionPlan = 'foundation';
    if (customerInfo.entitlements.active[ENTITLEMENTS.lifetime]) {
      plan = 'lifetime';
    } else if (customerInfo.entitlements.active[ENTITLEMENTS.premium]) {
      const premiumEntitlement = customerInfo.entitlements.active[ENTITLEMENTS.premium];
      if (premiumEntitlement.productIdentifier === PRODUCT_IDS.transformation) {
        plan = 'transformation';
      }
    }

    // Determine status
    const isActive = Object.keys(customerInfo.entitlements.active).length > 0;

    // Create or update subscription in our backend
    const now = new Date();
    let periodEnd = new Date(now);
    let isTrialPeriod = false;

    // Calculate period based on plan
    switch (plan) {
      case 'foundation':
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        break;
      case 'transformation':
        periodEnd.setMonth(periodEnd.getMonth() + 6);
        isTrialPeriod = true;
        break;
      case 'lifetime':
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        break;
    }

    await subscriptionService.createSubscription(
      plan,
      originalAppUserId,
      now,
      periodEnd,
      isTrialPeriod
    );

    if (isActive) {
      await subscriptionService.updateSubscriptionStatus(
        originalAppUserId,
        isTrialPeriod ? 'trial' : 'active',
        periodEnd
      );
    }
  } catch (error) {
    console.error('Failed to sync subscription to backend:', error);
    // Don't throw - we don't want to fail the purchase if backend sync fails
  }
}

/**
 * Set up listener for subscription changes
 */
export function addCustomerInfoUpdateListener(
  callback: (customerInfo: CustomerInfo) => void
): () => void {
  const listener = Purchases.addCustomerInfoUpdateListener(callback);
  return () => listener.remove();
}

/**
 * Get formatted price string for a package
 */
export function getPackagePrice(pkg: PurchasesPackage): string {
  return pkg.product.priceString;
}

/**
 * Get price per month for a package
 */
export function getPricePerMonth(pkg: PurchasesPackage): string {
  const price = pkg.product.price;
  const period = pkg.packageType;

  switch (period) {
    case 'MONTHLY':
      return pkg.product.priceString;
    case 'SIX_MONTH':
      return `${(price / 6).toFixed(2)}`;
    case 'ANNUAL':
      return `${(price / 12).toFixed(2)}`;
    default:
      return pkg.product.priceString;
  }
}

/**
 * Map our plan names to RevenueCat product IDs
 */
export function getPlanProductId(plan: SubscriptionPlan): string {
  return PRODUCT_IDS[plan];
}

/**
 * Check if we're in sandbox mode
 */
export async function isSandbox(): Promise<boolean> {
  try {
    const customerInfo = await getCustomerInfo();
    // Check if any entitlement is from sandbox
    for (const entitlement of Object.values(customerInfo.entitlements.all) as { isSandbox?: boolean }[]) {
      if (entitlement.isSandbox) {
        return true;
      }
    }
    return false;
  } catch (error) {
    return false;
  }
}

export default {
  initializeRevenueCat,
  identifyUser,
  logoutUser,
  getOfferings,
  getPackages,
  getCustomerInfo,
  hasActiveSubscription,
  getCurrentTier,
  purchasePackage,
  purchaseProduct,
  restorePurchases,
  syncSubscriptionToBackend,
  addCustomerInfoUpdateListener,
  getPackagePrice,
  getPricePerMonth,
  getPlanProductId,
  isSandbox,
  PRODUCT_IDS,
  ENTITLEMENTS,
};
