// Supabase client
export { supabase, getCurrentUser, getCurrentSession } from './supabase';

// Database types
export * from './database.types';

// Auth service
export {
  signUp,
  signIn,
  signInWithProvider,
  signOut,
  resetPassword,
  updatePassword,
  getProfile,
  updateProfile,
  onAuthStateChange,
  isAuthenticated,
} from './authService';

// Progress service
export {
  getUserProgress,
  completeLesson,
  updateCurrentChapter,
  awardBadge,
  recordQuizAttempt,
  getQuizAttempts,
  canRetryQuiz,
  getBestQuizScore,
  recordMilestone,
  getMilestones,
  shareMilestone,
  calculateUnlockedDay,
  canAccessLesson,
} from './progressService';

// Journal service
export {
  saveJournalEntry,
  getTodayEntry,
  getEntryByDate,
  getEntriesForDateRange,
  getRecentEntries,
  getAllEntries,
  deleteEntry,
  getWeeklySummary,
  getMoodTrend,
  exportJournalAsJson,
  exportJournalAsCsv,
  type JournalEntryData,
} from './journalService';

// Subscription service
export {
  getSubscription,
  hasActiveSubscription,
  getSubscriptionTier,
  isInTrial,
  getTrialDaysRemaining,
  getAvailableFeatures,
  hasFeature,
  getPlanPricing,
  formatPrice,
  formatPeriod,
  getPerMonthCost,
  createSubscription,
  updateSubscriptionStatus,
  convertTrialToActive,
  cancelSubscription,
  comparePlans,
} from './subscriptionService';

// RevenueCat service
export {
  initializeRevenueCat,
  identifyUser,
  getOfferings,
  getPackages,
  getCustomerInfo,
  purchasePackage,
  purchaseProduct,
  restorePurchases,
  PRODUCT_IDS,
  ENTITLEMENTS,
} from './revenueCatService';

// Badge service
export {
  getAllBadges,
  getBadgesByCategory,
  getUserBadges,
  getBadgesWithStatus,
  awardBadge as awardNewBadge,
  hasBadge,
  getBadgeStats,
  checkAndAwardBadges,
  getRecentBadges,
  getBadgeById,
} from './badgeService';

// Community service
export {
  getOrCreatePublicProfile,
  getPublicProfile,
  updatePublicProfile,
  searchProfiles,
  followUser,
  unfollowUser,
  isFollowing,
  getFollowers,
  getFollowing,
  getFollowCounts,
  createPost,
  deletePost,
  getActivityFeed,
  getPublicFeed,
  getUserPosts,
  encouragePost,
  removeEncouragement,
  toggleEncouragement,
  getPostEncouragements,
  autoShareBadge,
  autoShareMilestone,
  autoShareStreak,
  getUserCommunityStats,
} from './communityService';

// Notification service
export {
  initNotifications,
  scheduleDailyReminder,
  cancelDailyReminder,
  updateReminderTime,
  getReminderSettings,
  saveReminderSettings,
  checkPermissions,
  getScheduledNotifications,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
} from './notificationService';
