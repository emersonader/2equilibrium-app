import { getSupabase, isSupabaseConfigured } from './supabase';
import { ensureProfileExists } from './authService';
import { isLessonFullyComplete } from './journalService';
import type { UserProgress, QuizAttempt, Milestone, QuizAttemptInsert } from './database.types';
import lessonsData from '@/data/content/lessons.json';

/**
 * Get user's progress and update current_day based on subscription start date
 */
export async function getUserProgress(): Promise<UserProgress | null> {
  if (!isSupabaseConfigured) return null;

  const client = getSupabase();
  const { data: { user } } = await client.auth.getUser();

  if (!user) return null;

  // Use the user's account creation date as the subscription start
  const userCreatedAt = user.created_at ? new Date(user.created_at) : new Date();

  const { data, error } = await client
    .from('user_progress')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;

  // If no progress exists, create initial record with subscription_start_date
  if (!data) {
    const { data: newProgress, error: createError } = await client
      .from('user_progress')
      .insert({
        user_id: user.id,
        current_day: 1,
        current_chapter: 1,
        completed_lessons: [],
        current_streak: 0,
        longest_streak: 0,
        subscription_start_date: userCreatedAt.toISOString(),
      })
      .select()
      .single();

    if (createError) throw createError;
    return newProgress as UserProgress;
  }

  // Always use user's account creation date as subscription start
  // This ensures consistency and fixes any incorrectly set dates
  const subscriptionStart = userCreatedAt;

  // Check if we need to update subscription_start_date in database
  const storedDate = data.subscription_start_date ? new Date(data.subscription_start_date) : null;
  const needsUpdate = !storedDate ||
    storedDate.toDateString() !== subscriptionStart.toDateString();

  if (needsUpdate) {
    const { error: updateError } = await client
      .from('user_progress')
      .update({ subscription_start_date: subscriptionStart.toISOString() })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Failed to set subscription_start_date:', updateError);
    }
  }

  // current_day should be based on completed lessons, not calendar days
  // This ensures users progress through lessons sequentially
  const completedCount = data.completed_lessons?.length || 0;
  const correctCurrentDay = Math.min(completedCount + 1, 30); // Next lesson to complete, capped at 30

  // Update current_day if it doesn't match actual progress
  if (data.current_day !== correctCurrentDay) {
    const { data: updatedProgress, error: updateError } = await client
      .from('user_progress')
      .update({
        current_day: correctCurrentDay,
        subscription_start_date: subscriptionStart.toISOString(),
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update current_day:', updateError);
      return data as UserProgress;
    }
    return updatedProgress as UserProgress;
  }

  return data as UserProgress;
}

/**
 * Mark a lesson as complete
 */
export async function completeLesson(lessonId: string): Promise<UserProgress> {
  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  // Ensure profile exists before saving (required by foreign key constraint)
  await ensureProfileExists();

  // Get current progress or create if doesn't exist
  let { data: progress, error: fetchError } = await sb
    .from('user_progress')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (fetchError) throw fetchError;

  // Create progress record if it doesn't exist
  if (!progress) {
    const { data: newProgress, error: createError } = await sb
      .from('user_progress')
      .insert({
        user_id: user.id,
        current_day: 1,
        current_chapter: 1,
        completed_lessons: [],
        current_streak: 0,
        longest_streak: 0,
      })
      .select()
      .single();

    if (createError) throw createError;
    progress = newProgress;
  }

  // Add lesson to completed list if not already there
  const completedLessons = progress.completed_lessons || [];
  const isNewCompletion = !completedLessons.includes(lessonId);
  if (isNewCompletion) {
    completedLessons.push(lessonId);
  }

  // current_day = next lesson to complete (based on completed lessons count)
  const newCurrentDay = Math.min(completedLessons.length + 1, 30);

  // Calculate streak - increment if this is a new completion
  const newStreak = isNewCompletion
    ? (progress.current_streak || 0) + 1
    : progress.current_streak;
  const newLongestStreak = Math.max(progress.longest_streak || 0, newStreak);

  // Update progress with streak
  const { data, error } = await sb
    .from('user_progress')
    .update({
      completed_lessons: completedLessons,
      current_day: newCurrentDay,
      current_streak: newStreak,
      longest_streak: newLongestStreak,
    })
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Update current chapter
 */
export async function updateCurrentChapter(chapterNumber: number): Promise<UserProgress> {
  const client = getSupabase();
  const { data: { user } } = await client.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await client
    .from('user_progress')
    .update({
      current_chapter: chapterNumber,
    })
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data as UserProgress;
}

/**
 * Award a badge
 */
export async function awardBadge(badgeId: string): Promise<UserProgress> {
  const { data: { user } } = await getSupabase().auth.getUser();

  if (!user) throw new Error('Not authenticated');

  // Get current progress
  const { data: progress, error: fetchError } = await getSupabase()
    .from('user_progress')
    .select('badges')
    .eq('user_id', user.id)
    .single();

  if (fetchError) throw fetchError;

  // Add badge if not already earned
  const badges = progress.badges || [];
  if (!badges.includes(badgeId)) {
    badges.push(badgeId);
  }

  const { data, error } = await getSupabase()
    .from('user_progress')
    .update({ badges })
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Record a quiz attempt
 */
export async function recordQuizAttempt(
  chapterId: string,
  score: number,
  passed: boolean,
  missedTopics: string[]
): Promise<QuizAttempt> {
  const { data: { user } } = await getSupabase().auth.getUser();

  if (!user) throw new Error('Not authenticated');

  // Calculate retry time (24 hours from now, unless lifetime user)
  const canRetryAt = passed ? null : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const attempt: QuizAttemptInsert = {
    user_id: user.id,
    chapter_id: chapterId,
    score,
    passed,
    missed_topics: missedTopics,
    can_retry_at: canRetryAt,
  };

  const { data, error } = await getSupabase()
    .from('quiz_attempts')
    .insert(attempt)
    .select()
    .single();

  if (error) throw error;

  // If passed, update progress and award badge
  if (passed) {
    const chapterNumber = parseInt(chapterId.replace('chapter_', ''));
    await updateCurrentChapter(chapterNumber + 1);
    await awardBadge(`chapter_${chapterNumber}_complete`);
  }

  return data;
}

/**
 * Get quiz attempts for a chapter
 */
export async function getQuizAttempts(chapterId: string): Promise<QuizAttempt[]> {
  const { data: { user } } = await getSupabase().auth.getUser();

  if (!user) return [];

  const { data, error } = await getSupabase()
    .from('quiz_attempts')
    .select('*')
    .eq('user_id', user.id)
    .eq('chapter_id', chapterId)
    .order('attempted_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Check if user can retry a quiz
 */
export async function canRetryQuiz(chapterId: string): Promise<{ canRetry: boolean; waitTime: number | null }> {
  const { data: { user } } = await getSupabase().auth.getUser();

  if (!user) return { canRetry: false, waitTime: null };

  // Get the most recent failed attempt
  const { data, error } = await getSupabase()
    .from('quiz_attempts')
    .select('can_retry_at, passed')
    .eq('user_id', user.id)
    .eq('chapter_id', chapterId)
    .order('attempted_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code === 'PGRST116') return { canRetry: true, waitTime: null }; // No attempts yet
  if (error) throw error;

  // If last attempt passed, user can't retry (already complete)
  if (data.passed) return { canRetry: false, waitTime: null };

  // Check if retry time has passed
  if (!data.can_retry_at) return { canRetry: true, waitTime: null };

  const retryAt = new Date(data.can_retry_at);
  const now = new Date();

  if (retryAt <= now) {
    return { canRetry: true, waitTime: null };
  } else {
    return { canRetry: false, waitTime: retryAt.getTime() - now.getTime() };
  }
}

/**
 * Get best quiz score for a chapter
 */
export async function getBestQuizScore(chapterId: string): Promise<number | null> {
  const { data: { user } } = await getSupabase().auth.getUser();

  if (!user) return null;

  const { data, error } = await getSupabase()
    .from('quiz_attempts')
    .select('score')
    .eq('user_id', user.id)
    .eq('chapter_id', chapterId)
    .order('score', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code === 'PGRST116') return null;
  if (error) throw error;

  return data.score;
}

/**
 * Record a milestone achievement
 */
export async function recordMilestone(milestoneType: string): Promise<Milestone> {
  const { data: { user } } = await getSupabase().auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await getSupabase()
    .from('milestones')
    .upsert({
      user_id: user.id,
      milestone_type: milestoneType,
    }, {
      onConflict: 'user_id,milestone_type',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get all user milestones
 */
export async function getMilestones(): Promise<Milestone[]> {
  const { data: { user } } = await getSupabase().auth.getUser();

  if (!user) return [];

  const { data, error } = await getSupabase()
    .from('milestones')
    .select('*')
    .eq('user_id', user.id)
    .order('achieved_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Mark a milestone as shared
 */
export async function shareMilestone(milestoneId: string): Promise<void> {
  const { error } = await getSupabase()
    .from('milestones')
    .update({ shared: true })
    .eq('id', milestoneId);

  if (error) throw error;
}

/**
 * Calculate unlock day based on subscription start
 */
export function calculateUnlockedDay(subscriptionStartDate: Date): number {
  // Use LOCAL calendar days for user-friendly day unlocking
  // Day 1 = subscription start date
  // Day 2 = next calendar day in user's timezone
  const today = new Date();

  // Get just the date parts in local timezone (ignore time)
  const startYear = subscriptionStartDate.getFullYear();
  const startMonth = subscriptionStartDate.getMonth();
  const startDay = subscriptionStartDate.getDate();

  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();

  // Create dates at midnight local time for comparison
  const startMidnight = new Date(startYear, startMonth, startDay, 0, 0, 0, 0);
  const todayMidnight = new Date(todayYear, todayMonth, todayDay, 0, 0, 0, 0);

  const diffTime = todayMidnight.getTime() - startMidnight.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); // Use round to handle DST

  return Math.min(diffDays + 1, 30); // Max 30 for Phase 1
}

/**
 * Check if a lesson is accessible
 * Lessons unlock when:
 * 1. It's Day 1 (always accessible)
 * 2. The previous lesson's journal AND movement are completed
 * 3. Only one new lesson per calendar day (time-based limit)
 * 4. Chapter quizzes must be passed at chapter boundaries
 */
export async function canAccessLesson(lessonDay: number): Promise<{
  canAccess: boolean;
  reason?: string;
  previousLessonStatus?: {
    journalComplete: boolean;
    movementComplete: boolean;
  };
}> {
  const progress = await getUserProgress();

  if (!progress || !progress.subscription_start_date) {
    return { canAccess: false, reason: 'No progress found' };
  }

  // Day 1 is always accessible
  if (lessonDay === 1) {
    return { canAccess: true };
  }

  // Time-based limit: can't access lessons beyond the calendar day limit
  const unlockedDay = calculateUnlockedDay(new Date(progress.subscription_start_date));
  if (lessonDay > unlockedDay) {
    return { canAccess: false, reason: 'This lesson is not available yet. Come back tomorrow!' };
  }

  // Must have passed previous chapter's quiz if at chapter boundary
  const chapterBoundaries = [6, 11, 16, 21, 26]; // Day after each chapter ends
  for (const boundary of chapterBoundaries) {
    if (lessonDay >= boundary && progress.current_chapter < Math.ceil(boundary / 5)) {
      return { canAccess: false, reason: 'Complete the chapter quiz to continue' };
    }
  }

  // Check if previous lesson is fully complete (journal + movement)
  const previousLessonDay = lessonDay - 1;
  const previousLesson = (lessonsData as any).lessons.find(
    (l: any) => l.dayNumber === previousLessonDay
  );

  if (previousLesson) {
    const status = await isLessonFullyComplete(previousLesson.id);

    if (!status.isComplete) {
      return {
        canAccess: false,
        reason: 'Complete the previous lesson\'s journal and movement to unlock this lesson',
        previousLessonStatus: {
          journalComplete: status.journalComplete,
          movementComplete: status.movementComplete,
        },
      };
    }
  }

  return { canAccess: true };
}

/**
 * Simple check if lesson is accessible (returns boolean only)
 */
export async function canAccessLessonSimple(lessonDay: number): Promise<boolean> {
  const result = await canAccessLesson(lessonDay);
  return result.canAccess;
}
