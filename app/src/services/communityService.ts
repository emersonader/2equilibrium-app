import { getSupabase, isSupabaseConfigured } from './supabase';
import type {
  PublicProfile,
  PublicProfileInsert,
  PublicProfileUpdate,
  Follow,
  ActivityPost,
  ActivityPostInsert,
  PostEncouragement,
  PostType,
  PostVisibility,
  ActivityFeedItem,
  UserCommunityStats,
} from './database.types';

// ============================================
// PUBLIC PROFILE FUNCTIONS
// ============================================

/**
 * Get or create public profile for current user
 */
export async function getOrCreatePublicProfile(): Promise<PublicProfile | null> {
  if (!isSupabaseConfigured) return null;

  const client = getSupabase();
  const { data: { user } } = await client.auth.getUser();

  if (!user) return null;

  // Try to get existing profile
  const { data: existing, error: fetchError } = await client
    .from('public_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) return existing;

  // Get private profile for display name
  const { data: privateProfile } = await client
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  // Create new public profile
  const { data: newProfile, error: createError } = await client
    .from('public_profiles')
    .insert({
      user_id: user.id,
      display_name: privateProfile?.full_name || 'Wellness Seeker',
    })
    .select()
    .single();

  if (createError) throw createError;
  return newProfile;
}

/**
 * Get public profile by user ID
 */
export async function getPublicProfile(userId: string): Promise<PublicProfile | null> {
  if (!isSupabaseConfigured) return null;

  const client = getSupabase();
  const { data, error } = await client
    .from('public_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

/**
 * Update public profile
 */
export async function updatePublicProfile(updates: PublicProfileUpdate): Promise<PublicProfile> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');

  const client = getSupabase();
  const { data: { user } } = await client.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await client
    .from('public_profiles')
    .update(updates)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Search public profiles
 */
export async function searchProfiles(query: string, limit: number = 20): Promise<PublicProfile[]> {
  if (!isSupabaseConfigured) return [];

  const client = getSupabase();
  const { data, error } = await client
    .from('public_profiles')
    .select('*')
    .eq('is_public', true)
    .ilike('display_name', `%${query}%`)
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// ============================================
// FOLLOW FUNCTIONS
// ============================================

/**
 * Follow a user
 */
export async function followUser(followingId: string): Promise<Follow> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');

  const client = getSupabase();
  const { data: { user } } = await client.auth.getUser();

  if (!user) throw new Error('Not authenticated');
  if (user.id === followingId) throw new Error('Cannot follow yourself');

  const { data, error } = await client
    .from('follows')
    .insert({
      follower_id: user.id,
      following_id: followingId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Unfollow a user
 */
export async function unfollowUser(followingId: string): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');

  const client = getSupabase();
  const { data: { user } } = await client.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { error } = await client
    .from('follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', followingId);

  if (error) throw error;
}

/**
 * Check if current user is following another user
 */
export async function isFollowing(followingId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  const client = getSupabase();
  const { data: { user } } = await client.auth.getUser();

  if (!user) return false;

  const { data, error } = await client
    .from('follows')
    .select('id')
    .eq('follower_id', user.id)
    .eq('following_id', followingId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

/**
 * Get followers of a user
 */
export async function getFollowers(userId: string, limit: number = 50): Promise<PublicProfile[]> {
  if (!isSupabaseConfigured) return [];

  const client = getSupabase();
  const { data, error } = await client
    .from('follows')
    .select('follower:public_profiles!follows_follower_id_fkey(*)')
    .eq('following_id', userId)
    .limit(limit);

  if (error) throw error;
  return (data || []).map(f => f.follower as unknown as PublicProfile).filter(Boolean);
}

/**
 * Get users that a user is following
 */
export async function getFollowing(userId: string, limit: number = 50): Promise<PublicProfile[]> {
  if (!isSupabaseConfigured) return [];

  const client = getSupabase();
  const { data, error } = await client
    .from('follows')
    .select('following:public_profiles!follows_following_id_fkey(*)')
    .eq('follower_id', userId)
    .limit(limit);

  if (error) throw error;
  return (data || []).map(f => f.following as unknown as PublicProfile).filter(Boolean);
}

/**
 * Get follow counts for a user
 */
export async function getFollowCounts(userId: string): Promise<{ followers: number; following: number }> {
  if (!isSupabaseConfigured) return { followers: 0, following: 0 };

  const client = getSupabase();

  const [followersResult, followingResult] = await Promise.all([
    client.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', userId),
    client.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', userId),
  ]);

  return {
    followers: followersResult.count || 0,
    following: followingResult.count || 0,
  };
}

// ============================================
// ACTIVITY POST FUNCTIONS
// ============================================

/**
 * Create an activity post
 */
export async function createPost(
  postType: PostType,
  content?: string,
  metadata?: Record<string, any>,
  visibility: PostVisibility = 'public'
): Promise<ActivityPost> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');

  const client = getSupabase();
  const { data: { user } } = await client.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const post: ActivityPostInsert = {
    user_id: user.id,
    post_type: postType,
    content,
    metadata: metadata || {},
    visibility,
  };

  const { data, error } = await client
    .from('activity_posts')
    .insert(post)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete an activity post
 */
export async function deletePost(postId: string): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');

  const client = getSupabase();
  const { error } = await client
    .from('activity_posts')
    .delete()
    .eq('id', postId);

  if (error) throw error;
}

/**
 * Get activity feed (posts from followed users + own posts)
 */
export async function getActivityFeed(limit: number = 20, offset: number = 0): Promise<ActivityFeedItem[]> {
  if (!isSupabaseConfigured) return [];

  const client = getSupabase();
  const { data: { user } } = await client.auth.getUser();

  if (!user) return [];

  // Get users that current user follows
  const { data: following } = await client
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id);

  const followingIds = (following || []).map(f => f.following_id);
  const userIds = [user.id, ...followingIds];

  // Get posts from self and followed users
  const { data: posts, error } = await client
    .from('activity_posts')
    .select(`
      *,
      public_profile:public_profiles!activity_posts_user_id_fkey(
        display_name,
        avatar_url,
        is_public
      )
    `)
    .in('user_id', userIds)
    .or(`visibility.eq.public,user_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  // Get encouragement counts and check if user has encouraged
  const postIds = (posts || []).map(p => p.id);

  const [encouragementCounts, userEncouragements] = await Promise.all([
    client
      .from('post_encouragements')
      .select('post_id')
      .in('post_id', postIds),
    client
      .from('post_encouragements')
      .select('post_id')
      .in('post_id', postIds)
      .eq('user_id', user.id),
  ]);

  // Count encouragements per post
  const countMap = new Map<string, number>();
  (encouragementCounts.data || []).forEach(e => {
    countMap.set(e.post_id, (countMap.get(e.post_id) || 0) + 1);
  });

  // Check which posts user has encouraged
  const encouragedSet = new Set((userEncouragements.data || []).map(e => e.post_id));

  return (posts || []).map(post => ({
    ...post,
    display_name: (post.public_profile as any)?.display_name || 'Unknown',
    avatar_url: (post.public_profile as any)?.avatar_url || null,
    is_public: (post.public_profile as any)?.is_public ?? true,
    encouragement_count: countMap.get(post.id) || 0,
    has_encouraged: encouragedSet.has(post.id),
  }));
}

/**
 * Get public feed (all public posts)
 */
export async function getPublicFeed(limit: number = 20, offset: number = 0): Promise<ActivityFeedItem[]> {
  if (!isSupabaseConfigured) return [];

  const client = getSupabase();
  const { data: { user } } = await client.auth.getUser();

  const { data: posts, error } = await client
    .from('activity_posts')
    .select(`
      *,
      public_profile:public_profiles!activity_posts_user_id_fkey(
        display_name,
        avatar_url,
        is_public
      )
    `)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  // Get encouragement counts
  const postIds = (posts || []).map(p => p.id);

  const [encouragementCounts, userEncouragements] = await Promise.all([
    client
      .from('post_encouragements')
      .select('post_id')
      .in('post_id', postIds),
    user ? client
      .from('post_encouragements')
      .select('post_id')
      .in('post_id', postIds)
      .eq('user_id', user.id) : Promise.resolve({ data: [] }),
  ]);

  const countMap = new Map<string, number>();
  (encouragementCounts.data || []).forEach(e => {
    countMap.set(e.post_id, (countMap.get(e.post_id) || 0) + 1);
  });

  const encouragedSet = new Set((userEncouragements.data || []).map(e => e.post_id));

  return (posts || []).map(post => ({
    ...post,
    display_name: (post.public_profile as any)?.display_name || 'Unknown',
    avatar_url: (post.public_profile as any)?.avatar_url || null,
    is_public: (post.public_profile as any)?.is_public ?? true,
    encouragement_count: countMap.get(post.id) || 0,
    has_encouraged: user ? encouragedSet.has(post.id) : false,
  }));
}

/**
 * Get posts by a specific user
 */
export async function getUserPosts(userId: string, limit: number = 20): Promise<ActivityFeedItem[]> {
  if (!isSupabaseConfigured) return [];

  const client = getSupabase();
  const { data: { user } } = await client.auth.getUser();

  const { data: posts, error } = await client
    .from('activity_posts')
    .select(`
      *,
      public_profile:public_profiles!activity_posts_user_id_fkey(
        display_name,
        avatar_url,
        is_public
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  const postIds = (posts || []).map(p => p.id);

  const [encouragementCounts, userEncouragements] = await Promise.all([
    client
      .from('post_encouragements')
      .select('post_id')
      .in('post_id', postIds),
    user ? client
      .from('post_encouragements')
      .select('post_id')
      .in('post_id', postIds)
      .eq('user_id', user.id) : Promise.resolve({ data: [] }),
  ]);

  const countMap = new Map<string, number>();
  (encouragementCounts.data || []).forEach(e => {
    countMap.set(e.post_id, (countMap.get(e.post_id) || 0) + 1);
  });

  const encouragedSet = new Set((userEncouragements.data || []).map(e => e.post_id));

  return (posts || []).map(post => ({
    ...post,
    display_name: (post.public_profile as any)?.display_name || 'Unknown',
    avatar_url: (post.public_profile as any)?.avatar_url || null,
    is_public: (post.public_profile as any)?.is_public ?? true,
    encouragement_count: countMap.get(post.id) || 0,
    has_encouraged: user ? encouragedSet.has(post.id) : false,
  }));
}

// ============================================
// ENCOURAGEMENT FUNCTIONS
// ============================================

/**
 * Encourage (like) a post
 */
export async function encouragePost(postId: string, emoji: string = '❤️'): Promise<PostEncouragement> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');

  const client = getSupabase();
  const { data: { user } } = await client.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await client
    .from('post_encouragements')
    .insert({
      post_id: postId,
      user_id: user.id,
      emoji,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Remove encouragement from a post
 */
export async function removeEncouragement(postId: string): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');

  const client = getSupabase();
  const { data: { user } } = await client.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { error } = await client
    .from('post_encouragements')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', user.id);

  if (error) throw error;
}

/**
 * Toggle encouragement on a post
 */
export async function toggleEncouragement(postId: string, emoji: string = '❤️'): Promise<boolean> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');

  const client = getSupabase();
  const { data: { user } } = await client.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  // Check if already encouraged
  const { data: existing } = await client
    .from('post_encouragements')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    await removeEncouragement(postId);
    return false;
  } else {
    await encouragePost(postId, emoji);
    return true;
  }
}

/**
 * Get encouragements for a post
 */
export async function getPostEncouragements(postId: string): Promise<PostEncouragement[]> {
  if (!isSupabaseConfigured) return [];

  const client = getSupabase();
  const { data, error } = await client
    .from('post_encouragements')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// ============================================
// AUTO-SHARE FUNCTIONS
// ============================================

/**
 * Auto-share a badge achievement
 */
export async function autoShareBadge(badgeId: string, badgeName: string): Promise<ActivityPost | null> {
  if (!isSupabaseConfigured) return null;

  const client = getSupabase();
  const { data: { user } } = await client.auth.getUser();

  if (!user) return null;

  // Check if auto-share is enabled
  const profile = await getPublicProfile(user.id);
  if (!profile?.auto_share_badges) return null;

  return createPost(
    'badge',
    `Just earned the "${badgeName}" badge!`,
    { badge_id: badgeId, badge_name: badgeName }
  );
}

/**
 * Auto-share a milestone achievement
 */
export async function autoShareMilestone(
  milestoneType: string,
  description: string
): Promise<ActivityPost | null> {
  if (!isSupabaseConfigured) return null;

  const client = getSupabase();
  const { data: { user } } = await client.auth.getUser();

  if (!user) return null;

  // Check if auto-share is enabled
  const profile = await getPublicProfile(user.id);
  if (!profile?.auto_share_milestones) return null;

  return createPost(
    'milestone',
    description,
    { milestone_type: milestoneType }
  );
}

/**
 * Auto-share streak achievement
 */
export async function autoShareStreak(streakCount: number): Promise<ActivityPost | null> {
  if (!isSupabaseConfigured) return null;

  const client = getSupabase();
  const { data: { user } } = await client.auth.getUser();

  if (!user) return null;

  // Check if auto-share is enabled
  const profile = await getPublicProfile(user.id);
  if (!profile?.auto_share_milestones) return null;

  // Only share milestone streaks
  const milestoneStreaks = [7, 14, 30, 60, 90];
  if (!milestoneStreaks.includes(streakCount)) return null;

  return createPost(
    'streak',
    `Just reached a ${streakCount}-day streak!`,
    { streak_count: streakCount }
  );
}

// ============================================
// USER COMMUNITY STATS
// ============================================

/**
 * Get community stats for a user
 */
export async function getUserCommunityStats(userId: string): Promise<UserCommunityStats | null> {
  if (!isSupabaseConfigured) return null;

  const client = getSupabase();

  const [profile, followCounts, postCount] = await Promise.all([
    getPublicProfile(userId),
    getFollowCounts(userId),
    client
      .from('activity_posts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
  ]);

  if (!profile) return null;

  return {
    user_id: userId,
    display_name: profile.display_name,
    avatar_url: profile.avatar_url,
    is_public: profile.is_public,
    follower_count: followCounts.followers,
    following_count: followCounts.following,
    post_count: postCount.count || 0,
  };
}
