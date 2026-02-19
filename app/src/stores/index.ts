// User store - authentication and profile state
export { useUserStore, default as userStore } from './userStore';

// Progress store - lesson and quiz progress
export { useProgressStore, default as progressStore } from './progressStore';

// Journal store - journal entries and tracking
export { useJournalStore, default as journalStore } from './journalStore';

// Subscription store - RevenueCat integration
export { useSubscriptionStore, default as subscriptionStore } from './subscriptionStore';

// Health store - BMI and weight tracking
export { useHealthStore, default as healthStore } from './healthStore';

// Badge store - gamification badges
export { useBadgeStore, useBadges, useEarnedBadges, useBadgeStats, useNewlyEarnedBadge } from './badgeStore';

// Community store - social features
export { useCommunityStore, useFeed, useMyProfile, useViewedProfile } from './communityStore';

// Notification store - push notification settings
export { useNotificationStore, default as notificationStore } from './notificationStore';

// Re-export types for convenience
export type { Profile, Subscription, UserProgress, JournalEntry, HealthProfile, WeightHistory, Badge, UserBadge, BadgeWithEarnedStatus, PublicProfile, ActivityFeedItem, UserCommunityStats } from '@/services/database.types';
