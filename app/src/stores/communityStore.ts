import { create } from 'zustand';
import * as communityService from '@/services/communityService';
import type {
  PublicProfile,
  PublicProfileUpdate,
  ActivityFeedItem,
  UserCommunityStats,
  PostType,
  PostVisibility,
} from '@/services/database.types';

interface CommunityState {
  // Current user's public profile
  myProfile: PublicProfile | null;

  // Feed state
  feed: ActivityFeedItem[];
  feedLoading: boolean;
  feedError: string | null;
  hasMoreFeed: boolean;

  // Profile view state
  viewedProfile: PublicProfile | null;
  viewedProfileStats: UserCommunityStats | null;
  viewedProfilePosts: ActivityFeedItem[];
  isFollowingViewed: boolean;

  // Followers/following lists
  followers: PublicProfile[];
  following: PublicProfile[];

  // Search state
  searchResults: PublicProfile[];
  searchLoading: boolean;

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Actions
  loadMyProfile: () => Promise<void>;
  updateMyProfile: (updates: PublicProfileUpdate) => Promise<void>;
  loadFeed: (refresh?: boolean) => Promise<void>;
  loadMoreFeed: () => Promise<void>;
  loadUserProfile: (userId: string) => Promise<void>;
  loadUserPosts: (userId: string) => Promise<void>;
  followUser: (userId: string) => Promise<void>;
  unfollowUser: (userId: string) => Promise<void>;
  toggleFollow: (userId: string) => Promise<boolean>;
  createPost: (type: PostType, content?: string, metadata?: Record<string, any>, visibility?: PostVisibility) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  toggleEncouragement: (postId: string) => Promise<void>;
  loadFollowers: (userId: string) => Promise<void>;
  loadFollowing: (userId: string) => Promise<void>;
  searchProfiles: (query: string) => Promise<void>;
  clearSearch: () => void;
  clearViewedProfile: () => void;
}

const FEED_PAGE_SIZE = 20;

export const useCommunityStore = create<CommunityState>((set, get) => ({
  // Initial state
  myProfile: null,
  feed: [],
  feedLoading: false,
  feedError: null,
  hasMoreFeed: true,
  viewedProfile: null,
  viewedProfileStats: null,
  viewedProfilePosts: [],
  isFollowingViewed: false,
  followers: [],
  following: [],
  searchResults: [],
  searchLoading: false,
  isLoading: false,
  error: null,

  // Load current user's public profile
  loadMyProfile: async () => {
    try {
      set({ isLoading: true, error: null });
      const profile = await communityService.getOrCreatePublicProfile();
      set({ myProfile: profile, isLoading: false });
    } catch (error) {
      console.error('Failed to load my profile:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load profile',
        isLoading: false,
      });
    }
  },

  // Update current user's public profile
  updateMyProfile: async (updates: PublicProfileUpdate) => {
    try {
      set({ isLoading: true, error: null });
      const profile = await communityService.updatePublicProfile(updates);
      set({ myProfile: profile, isLoading: false });
    } catch (error) {
      console.error('Failed to update profile:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to update profile',
        isLoading: false,
      });
      throw error;
    }
  },

  // Load activity feed
  loadFeed: async (refresh = false) => {
    try {
      set({ feedLoading: true, feedError: null });

      if (refresh) {
        set({ feed: [], hasMoreFeed: true });
      }

      const posts = await communityService.getActivityFeed(FEED_PAGE_SIZE, 0);

      set({
        feed: posts,
        feedLoading: false,
        hasMoreFeed: posts.length >= FEED_PAGE_SIZE,
      });
    } catch (error) {
      console.error('Failed to load feed:', error);
      set({
        feedError: error instanceof Error ? error.message : 'Failed to load feed',
        feedLoading: false,
      });
    }
  },

  // Load more feed posts (pagination)
  loadMoreFeed: async () => {
    const { feed, feedLoading, hasMoreFeed } = get();

    if (feedLoading || !hasMoreFeed) return;

    try {
      set({ feedLoading: true });

      const posts = await communityService.getActivityFeed(FEED_PAGE_SIZE, feed.length);

      set({
        feed: [...feed, ...posts],
        feedLoading: false,
        hasMoreFeed: posts.length >= FEED_PAGE_SIZE,
      });
    } catch (error) {
      console.error('Failed to load more feed:', error);
      set({ feedLoading: false });
    }
  },

  // Load a user's profile for viewing
  loadUserProfile: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });

      const [profile, stats, isFollowing] = await Promise.all([
        communityService.getPublicProfile(userId),
        communityService.getUserCommunityStats(userId),
        communityService.isFollowing(userId),
      ]);

      set({
        viewedProfile: profile,
        viewedProfileStats: stats,
        isFollowingViewed: isFollowing,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load user profile:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load profile',
        isLoading: false,
      });
    }
  },

  // Load a user's posts
  loadUserPosts: async (userId: string) => {
    try {
      const posts = await communityService.getUserPosts(userId);
      set({ viewedProfilePosts: posts });
    } catch (error) {
      console.error('Failed to load user posts:', error);
    }
  },

  // Follow a user
  followUser: async (userId: string) => {
    try {
      await communityService.followUser(userId);
      set({ isFollowingViewed: true });

      // Update stats if viewing this profile
      const { viewedProfileStats } = get();
      if (viewedProfileStats && viewedProfileStats.user_id === userId) {
        set({
          viewedProfileStats: {
            ...viewedProfileStats,
            follower_count: viewedProfileStats.follower_count + 1,
          },
        });
      }
    } catch (error) {
      console.error('Failed to follow user:', error);
      throw error;
    }
  },

  // Unfollow a user
  unfollowUser: async (userId: string) => {
    try {
      await communityService.unfollowUser(userId);
      set({ isFollowingViewed: false });

      // Update stats if viewing this profile
      const { viewedProfileStats } = get();
      if (viewedProfileStats && viewedProfileStats.user_id === userId) {
        set({
          viewedProfileStats: {
            ...viewedProfileStats,
            follower_count: Math.max(0, viewedProfileStats.follower_count - 1),
          },
        });
      }
    } catch (error) {
      console.error('Failed to unfollow user:', error);
      throw error;
    }
  },

  // Toggle follow status
  toggleFollow: async (userId: string) => {
    const { isFollowingViewed } = get();

    if (isFollowingViewed) {
      await get().unfollowUser(userId);
      return false;
    } else {
      await get().followUser(userId);
      return true;
    }
  },

  // Create a new post
  createPost: async (type, content, metadata, visibility = 'public') => {
    try {
      set({ isLoading: true, error: null });
      await communityService.createPost(type, content, metadata, visibility);

      // Refresh feed to show new post
      await get().loadFeed(true);

      set({ isLoading: false });
    } catch (error) {
      console.error('Failed to create post:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to create post',
        isLoading: false,
      });
      throw error;
    }
  },

  // Delete a post
  deletePost: async (postId: string) => {
    try {
      await communityService.deletePost(postId);

      // Remove from feed
      const { feed } = get();
      set({ feed: feed.filter(p => p.id !== postId) });
    } catch (error) {
      console.error('Failed to delete post:', error);
      throw error;
    }
  },

  // Toggle encouragement on a post
  toggleEncouragement: async (postId: string) => {
    try {
      const isNowEncouraged = await communityService.toggleEncouragement(postId);

      // Update feed
      const { feed, viewedProfilePosts } = get();

      const updatePost = (posts: ActivityFeedItem[]) =>
        posts.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              has_encouraged: isNowEncouraged,
              encouragement_count: isNowEncouraged
                ? p.encouragement_count + 1
                : Math.max(0, p.encouragement_count - 1),
            };
          }
          return p;
        });

      set({
        feed: updatePost(feed),
        viewedProfilePosts: updatePost(viewedProfilePosts),
      });
    } catch (error) {
      console.error('Failed to toggle encouragement:', error);
      throw error;
    }
  },

  // Load followers for a user
  loadFollowers: async (userId: string) => {
    try {
      const followers = await communityService.getFollowers(userId);
      set({ followers });
    } catch (error) {
      console.error('Failed to load followers:', error);
    }
  },

  // Load following for a user
  loadFollowing: async (userId: string) => {
    try {
      const following = await communityService.getFollowing(userId);
      set({ following });
    } catch (error) {
      console.error('Failed to load following:', error);
    }
  },

  // Search for profiles
  searchProfiles: async (query: string) => {
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }

    try {
      set({ searchLoading: true });
      const results = await communityService.searchProfiles(query);
      set({ searchResults: results, searchLoading: false });
    } catch (error) {
      console.error('Failed to search profiles:', error);
      set({ searchLoading: false });
    }
  },

  // Clear search results
  clearSearch: () => {
    set({ searchResults: [], searchLoading: false });
  },

  // Clear viewed profile
  clearViewedProfile: () => {
    set({
      viewedProfile: null,
      viewedProfileStats: null,
      viewedProfilePosts: [],
      isFollowingViewed: false,
    });
  },
}));

// Selector hooks
export const useFeed = () => useCommunityStore(state => state.feed);
export const useMyProfile = () => useCommunityStore(state => state.myProfile);
export const useViewedProfile = () => useCommunityStore(state => ({
  profile: state.viewedProfile,
  stats: state.viewedProfileStats,
  posts: state.viewedProfilePosts,
  isFollowing: state.isFollowingViewed,
}));
