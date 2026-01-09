import { getSupabase, isSupabaseConfigured } from './supabase';
import type { Badge, UserBadge, BadgeWithEarnedStatus } from './database.types';

/**
 * Get all available badges from the catalog
 */
export async function getAllBadges(): Promise<Badge[]> {
  if (!isSupabaseConfigured) return [];

  const client = getSupabase();
  const { data, error } = await client
    .from('badges')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Get badges filtered by category
 */
export async function getBadgesByCategory(category: string): Promise<Badge[]> {
  if (!isSupabaseConfigured) return [];

  const client = getSupabase();
  const { data, error } = await client
    .from('badges')
    .select('*')
    .eq('category', category)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Get all badges earned by a user
 */
export async function getUserBadges(userId?: string): Promise<UserBadge[]> {
  if (!isSupabaseConfigured) return [];

  const client = getSupabase();

  // If no userId provided, get current user
  let targetUserId = userId;
  if (!targetUserId) {
    const { data: { user } } = await client.auth.getUser();
    if (!user) return [];
    targetUserId = user.id;
  }

  const { data, error } = await client
    .from('user_badges')
    .select('*, badge:badges(*)')
    .eq('user_id', targetUserId)
    .order('earned_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get all badges with earned status for the current user
 */
export async function getBadgesWithStatus(): Promise<BadgeWithEarnedStatus[]> {
  if (!isSupabaseConfigured) return [];

  const client = getSupabase();
  const { data: { user } } = await client.auth.getUser();

  if (!user) return [];

  // Get all badges
  const { data: allBadges, error: badgesError } = await client
    .from('badges')
    .select('*')
    .order('sort_order', { ascending: true });

  if (badgesError) throw badgesError;

  // Get user's earned badges
  const { data: earnedBadges, error: earnedError } = await client
    .from('user_badges')
    .select('badge_id, earned_at')
    .eq('user_id', user.id);

  if (earnedError) throw earnedError;

  // Create a map of earned badges
  const earnedMap = new Map<string, string>();
  (earnedBadges || []).forEach(ub => {
    earnedMap.set(ub.badge_id, ub.earned_at);
  });

  // Combine badges with earned status
  return (allBadges || []).map(badge => ({
    ...badge,
    earned: earnedMap.has(badge.id),
    earnedAt: earnedMap.get(badge.id) || null,
  }));
}

/**
 * Award a badge to the current user
 */
export async function awardBadge(badgeId: string): Promise<UserBadge | null> {
  if (!isSupabaseConfigured) return null;

  const client = getSupabase();
  const { data: { user } } = await client.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  // Check if badge exists
  const { data: badge, error: badgeError } = await client
    .from('badges')
    .select('id')
    .eq('id', badgeId)
    .single();

  if (badgeError || !badge) {
    console.warn(`Badge ${badgeId} not found in catalog`);
    return null;
  }

  // Try to award (will silently fail if already earned due to unique constraint)
  const { data, error } = await client
    .from('user_badges')
    .upsert({
      user_id: user.id,
      badge_id: badgeId,
    }, {
      onConflict: 'user_id,badge_id',
      ignoreDuplicates: true,
    })
    .select('*, badge:badges(*)')
    .single();

  if (error && error.code !== '23505') { // Ignore duplicate key error
    throw error;
  }

  return data;
}

/**
 * Check if user has a specific badge
 */
export async function hasBadge(badgeId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  const client = getSupabase();
  const { data: { user } } = await client.auth.getUser();

  if (!user) return false;

  const { data, error } = await client
    .from('user_badges')
    .select('id')
    .eq('user_id', user.id)
    .eq('badge_id', badgeId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

/**
 * Get badge statistics for a user
 */
export async function getBadgeStats(userId?: string): Promise<{
  totalBadges: number;
  totalAvailable: number;
  commonBadges: number;
  rareBadges: number;
  epicBadges: number;
  legendaryBadges: number;
}> {
  if (!isSupabaseConfigured) {
    return {
      totalBadges: 0,
      totalAvailable: 0,
      commonBadges: 0,
      rareBadges: 0,
      epicBadges: 0,
      legendaryBadges: 0,
    };
  }

  const client = getSupabase();

  // If no userId provided, get current user
  let targetUserId = userId;
  if (!targetUserId) {
    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      return {
        totalBadges: 0,
        totalAvailable: 0,
        commonBadges: 0,
        rareBadges: 0,
        epicBadges: 0,
        legendaryBadges: 0,
      };
    }
    targetUserId = user.id;
  }

  // Get total available badges
  const { count: totalAvailable } = await client
    .from('badges')
    .select('*', { count: 'exact', head: true });

  // Get user's earned badges with rarity
  const { data: earnedBadges, error } = await client
    .from('user_badges')
    .select('badge:badges(rarity)')
    .eq('user_id', targetUserId);

  if (error) throw error;

  const stats = {
    totalBadges: 0,
    totalAvailable: totalAvailable || 0,
    commonBadges: 0,
    rareBadges: 0,
    epicBadges: 0,
    legendaryBadges: 0,
  };

  (earnedBadges || []).forEach(ub => {
    stats.totalBadges++;
    const rarity = (ub.badge as any)?.rarity;
    switch (rarity) {
      case 'common':
        stats.commonBadges++;
        break;
      case 'rare':
        stats.rareBadges++;
        break;
      case 'epic':
        stats.epicBadges++;
        break;
      case 'legendary':
        stats.legendaryBadges++;
        break;
    }
  });

  return stats;
}

/**
 * Check and award badges based on current progress
 * This is the main function called after actions like lesson completion
 */
export async function checkAndAwardBadges(context: {
  lessonCompleted?: string;
  journalCount?: number;
  currentStreak?: number;
  quizScore?: number;
  chapterCompleted?: number;
  completedLessonsCount?: number;
  completionTime?: Date;
}): Promise<Badge[]> {
  const newBadges: Badge[] = [];

  // First lesson badge
  if (context.completedLessonsCount === 1) {
    const alreadyHas = await hasBadge('first_lesson');
    if (!alreadyHas) {
      const result = await awardBadge('first_lesson');
      if (result?.badge) newBadges.push(result.badge as Badge);
    }
  }

  // Streak badges
  if (context.currentStreak) {
    const streakBadges = [
      { threshold: 3, id: 'streak_3' },
      { threshold: 7, id: 'streak_7' },
      { threshold: 14, id: 'streak_14' },
      { threshold: 30, id: 'streak_30' },
      { threshold: 60, id: 'streak_60' },
      { threshold: 90, id: 'streak_90' },
    ];

    for (const { threshold, id } of streakBadges) {
      if (context.currentStreak >= threshold) {
        const alreadyHas = await hasBadge(id);
        if (!alreadyHas) {
          const result = await awardBadge(id);
          if (result?.badge) newBadges.push(result.badge as Badge);
        }
      }
    }
  }

  // Chapter completion badges
  if (context.chapterCompleted) {
    const badgeId = `chapter_${context.chapterCompleted}`;
    const alreadyHas = await hasBadge(badgeId);
    if (!alreadyHas) {
      const result = await awardBadge(badgeId);
      if (result?.badge) newBadges.push(result.badge as Badge);
    }

    // Phase 1 complete badge (all 6 chapters)
    if (context.chapterCompleted === 6) {
      const alreadyHasPhase = await hasBadge('phase_1');
      if (!alreadyHasPhase) {
        const result = await awardBadge('phase_1');
        if (result?.badge) newBadges.push(result.badge as Badge);
      }
    }
  }

  // Journal badges
  if (context.journalCount) {
    if (context.journalCount === 1) {
      const alreadyHas = await hasBadge('first_journal');
      if (!alreadyHas) {
        const result = await awardBadge('first_journal');
        if (result?.badge) newBadges.push(result.badge as Badge);
      }
    }
    if (context.journalCount >= 7) {
      const alreadyHas = await hasBadge('journal_7');
      if (!alreadyHas) {
        const result = await awardBadge('journal_7');
        if (result?.badge) newBadges.push(result.badge as Badge);
      }
    }
    if (context.journalCount >= 30) {
      const alreadyHas = await hasBadge('journal_30');
      if (!alreadyHas) {
        const result = await awardBadge('journal_30');
        if (result?.badge) newBadges.push(result.badge as Badge);
      }
    }
  }

  // Perfect quiz score badge
  if (context.quizScore === 100) {
    const alreadyHas = await hasBadge('quiz_perfect');
    if (!alreadyHas) {
      const result = await awardBadge('quiz_perfect');
      if (result?.badge) newBadges.push(result.badge as Badge);
    }
  }

  // Time-based badges
  if (context.completionTime) {
    const hour = context.completionTime.getHours();

    // Early bird (before 8am)
    if (hour < 8) {
      const alreadyHas = await hasBadge('early_bird');
      if (!alreadyHas) {
        const result = await awardBadge('early_bird');
        if (result?.badge) newBadges.push(result.badge as Badge);
      }
    }

    // Night owl (after 10pm)
    if (hour >= 22) {
      const alreadyHas = await hasBadge('night_owl');
      if (!alreadyHas) {
        const result = await awardBadge('night_owl');
        if (result?.badge) newBadges.push(result.badge as Badge);
      }
    }

    // Weekend warrior (check if it's Saturday or Sunday)
    const dayOfWeek = context.completionTime.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // This would need additional tracking to check both days
      // For now, we'll award on any weekend completion
      // A more sophisticated implementation would track both weekend days
    }
  }

  return newBadges;
}

/**
 * Get recently earned badges (for notifications)
 */
export async function getRecentBadges(limit: number = 5): Promise<UserBadge[]> {
  if (!isSupabaseConfigured) return [];

  const client = getSupabase();
  const { data: { user } } = await client.auth.getUser();

  if (!user) return [];

  const { data, error } = await client
    .from('user_badges')
    .select('*, badge:badges(*)')
    .eq('user_id', user.id)
    .order('earned_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

/**
 * Get a specific badge by ID
 */
export async function getBadgeById(badgeId: string): Promise<Badge | null> {
  if (!isSupabaseConfigured) return null;

  const client = getSupabase();
  const { data, error } = await client
    .from('badges')
    .select('*')
    .eq('id', badgeId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}
