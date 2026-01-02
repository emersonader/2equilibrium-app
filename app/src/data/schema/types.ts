/**
 * Holistic Wellness Journey - TypeScript Type Definitions
 */

// ============ CONTENT TYPES ============

export interface Phase {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  description: string;
  durationDays: number;
  chapters: Chapter[];
}

export interface Chapter {
  id: string;
  phaseId: string;
  number: number;
  title: string;
  subtitle: string;
  description: string;
  daysRange: {
    start: number;
    end: number;
  };
  color: string;
  icon: string;
  quizId: string;
}

export interface Lesson {
  id: string;
  chapterId: string;
  dayNumber: number;
  title: string;
  content: {
    introduction: string;
    mainContent: string;
    keyTakeaways: string[];
    actionStep: string;
  };
  journalPrompt: {
    primary: string;
    reflection: string;
    gratitude: string | null;
  };
  movementSuggestion: {
    basic: string;
    personalized: string;
    videoUrl: string | null;
  };
  affirmation: string;
  nourishmentTip: string;
}

export interface Quiz {
  id: string;
  chapterId: string;
  title: string;
  passingScore: number;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'reflection';
  topicTag: string;
  lessonDayRef: number;
  question: string;
  options?: string[];
  correctAnswer: number | boolean | null;
  explanation: string;
  reviewContent: string | null;
}

export interface TopicReview {
  lessonDay: number;
  reviewTitle: string;
  keyPoints: string[];
}

// ============ USER TYPES ============

export type SubscriptionTier = 'none' | 'foundation' | 'transformation' | 'lifetime';
export type SubscriptionStatus = 'trial' | 'active' | 'lapsed' | 'cancelled';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  onboardingCompleted: boolean;
  notificationPreferences: NotificationPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationPreferences {
  morningWisdom: boolean;
  lessonReminder: boolean;
  gentleNudge: boolean;
  streakReminder: boolean;
  weeklyReview: boolean;
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string; // "07:00"
}

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionTier;
  status: SubscriptionStatus;
  trialEndDate: Date | null;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  revenueCatCustomerId: string | null;
  createdAt: Date;
}

export interface UserProgress {
  id: string;
  userId: string;
  currentPhase: number;
  currentChapter: number;
  currentDay: number;
  subscriptionStartDate: Date;
  completedLessons: string[];
  badges: string[];
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  chapterId: string;
  score: number;
  passed: boolean;
  missedTopics: string[];
  canRetryAt: Date | null;
  attemptedAt: Date;
}

export interface JournalEntry {
  id: string;
  userId: string;
  lessonId: string | null;
  entryDate: Date;
  entryType: 'daily' | 'weekly_review' | 'freeform';
  promptResponse: string | null;
  reflectionResponse: string | null;
  gratitudeResponse: string | null;
  freeformNotes: string | null;
  mood: number | null; // 1-5
  energy: number | null; // 1-5
  nourishmentQuality: number | null; // 1-5
  movementCompleted: boolean | null;
  waterIntake: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Milestone {
  id: string;
  userId: string;
  milestoneType: MilestoneType;
  achievedAt: Date;
  shared: boolean;
}

export type MilestoneType =
  | 'day_7'
  | 'day_14'
  | 'day_30'
  | 'day_60'
  | 'day_90'
  | 'day_180'
  | 'day_365'
  | 'chapter_1_complete'
  | 'chapter_2_complete'
  | 'chapter_3_complete'
  | 'chapter_4_complete'
  | 'chapter_5_complete'
  | 'chapter_6_complete'
  | 'phase_1_complete'
  | 'first_journal_entry'
  | 'streak_7'
  | 'streak_30';

// ============ UI STATE TYPES ============

export interface ChapterUIState {
  chapter: Chapter;
  isLocked: boolean;
  isCompleted: boolean;
  quizPassed: boolean;
  quizScore: number | null;
  lessonsCompleted: number;
  totalLessons: number;
}

export interface LessonUIState {
  lesson: Lesson;
  isLocked: boolean;
  isCompleted: boolean;
  isToday: boolean;
}

export interface QuizUIState {
  quiz: Quiz;
  currentQuestionIndex: number;
  answers: Record<string, number | boolean | string>;
  isSubmitted: boolean;
  score: number | null;
  passed: boolean | null;
  missedTopics: string[];
}
