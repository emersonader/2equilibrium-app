/**
 * Supabase Database Types
 * Generated to match our schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SubscriptionPlan = 'foundation' | 'transformation' | 'lifetime';
export type SubscriptionStatus = 'trial' | 'active' | 'lapsed' | 'cancelled';
export type JournalEntryType = 'daily' | 'weekly_review' | 'freeform';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type UnitSystem = 'metric' | 'imperial';
export type BadgeCategory = 'streak' | 'chapter' | 'milestone' | 'special';
export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type PostType = 'milestone' | 'badge' | 'streak' | 'chapter' | 'custom';
export type PostVisibility = 'public' | 'followers' | 'private';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;

          // Website compatibility fields
          email: string;
          name: string | null;
          tier: string;
          is_admin: boolean;

          // Mobile app fields
          full_name: string | null;
          avatar_url: string | null;
          onboarding_completed: boolean;
          notification_preferences: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;

          // Website compatibility fields
          email: string;
          name?: string | null;
          tier?: string;
          is_admin?: boolean;

          // Mobile app fields
          full_name?: string | null;
          avatar_url?: string | null;
          onboarding_completed?: boolean;
          notification_preferences?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;

          // Website compatibility fields
          email?: string;
          name?: string | null;
          tier?: string;
          is_admin?: boolean;

          // Mobile app fields
          full_name?: string | null;
          avatar_url?: string | null;
          onboarding_completed?: boolean;
          notification_preferences?: Json | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: SubscriptionPlan;
          status: SubscriptionStatus;
          trial_end_date: string | null;
          current_period_start: string;
          current_period_end: string;
          revenuecat_customer_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan: SubscriptionPlan;
          status: SubscriptionStatus;
          trial_end_date?: string | null;
          current_period_start: string;
          current_period_end: string;
          revenuecat_customer_id?: string | null;
          created_at?: string;
        };
        Update: {
          plan?: SubscriptionPlan;
          status?: SubscriptionStatus;
          trial_end_date?: string | null;
          current_period_start?: string;
          current_period_end?: string;
          revenuecat_customer_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      user_progress: {
        Row: {
          id: string;
          user_id: string;
          current_phase: number;
          current_chapter: number;
          current_day: number;
          subscription_start_date: string | null;
          completed_lessons: string[];
          badges: string[];
          current_streak: number;
          longest_streak: number;
          last_active_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          current_phase?: number;
          current_chapter?: number;
          current_day?: number;
          subscription_start_date?: string | null;
          completed_lessons?: string[];
          badges?: string[];
          current_streak?: number;
          longest_streak?: number;
          last_active_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          current_phase?: number;
          current_chapter?: number;
          current_day?: number;
          subscription_start_date?: string | null;
          completed_lessons?: string[];
          badges?: string[];
          current_streak?: number;
          longest_streak?: number;
          last_active_date?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_progress_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      quiz_attempts: {
        Row: {
          id: string;
          user_id: string;
          chapter_id: string;
          score: number;
          passed: boolean;
          missed_topics: string[];
          can_retry_at: string | null;
          attempted_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          chapter_id: string;
          score: number;
          passed: boolean;
          missed_topics?: string[];
          can_retry_at?: string | null;
          attempted_at?: string;
        };
        Update: {
          score?: number;
          passed?: boolean;
          missed_topics?: string[];
          can_retry_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      journal_entries: {
        Row: {
          id: string;
          user_id: string;
          lesson_id: string | null;
          entry_date: string;
          entry_type: JournalEntryType;
          prompt_response: string | null;
          reflection_response: string | null;
          gratitude_response: string | null;
          freeform_notes: string | null;
          mood: number | null;
          energy: number | null;
          nourishment_quality: number | null;
          movement_completed: boolean | null;
          water_intake: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          lesson_id?: string | null;
          entry_date: string;
          entry_type: JournalEntryType;
          prompt_response?: string | null;
          reflection_response?: string | null;
          gratitude_response?: string | null;
          freeform_notes?: string | null;
          mood?: number | null;
          energy?: number | null;
          nourishment_quality?: number | null;
          movement_completed?: boolean | null;
          water_intake?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          lesson_id?: string | null;
          entry_type?: JournalEntryType;
          prompt_response?: string | null;
          reflection_response?: string | null;
          gratitude_response?: string | null;
          freeform_notes?: string | null;
          mood?: number | null;
          energy?: number | null;
          nourishment_quality?: number | null;
          movement_completed?: boolean | null;
          water_intake?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "journal_entries_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      milestones: {
        Row: {
          id: string;
          user_id: string;
          milestone_type: string;
          achieved_at: string;
          shared: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          milestone_type: string;
          achieved_at?: string;
          shared?: boolean;
        };
        Update: {
          shared?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "milestones_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      food_entries: {
        Row: {
          id: string;
          user_id: string;
          entry_date: string;
          meal_type: MealType;
          food_name: string;
          brand: string | null;
          barcode: string | null;
          serving_size: number | null;
          serving_unit: string | null;
          calories: number | null;
          protein: number | null;
          carbs: number | null;
          fat: number | null;
          fiber: number | null;
          sugar: number | null;
          sodium: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          entry_date: string;
          meal_type: MealType;
          food_name: string;
          brand?: string | null;
          barcode?: string | null;
          serving_size?: number | null;
          serving_unit?: string | null;
          calories?: number | null;
          protein?: number | null;
          carbs?: number | null;
          fat?: number | null;
          fiber?: number | null;
          sugar?: number | null;
          sodium?: number | null;
          created_at?: string;
        };
        Update: {
          meal_type?: MealType;
          food_name?: string;
          brand?: string | null;
          barcode?: string | null;
          serving_size?: number | null;
          serving_unit?: string | null;
          calories?: number | null;
          protein?: number | null;
          carbs?: number | null;
          fat?: number | null;
          fiber?: number | null;
          sugar?: number | null;
          sodium?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "food_entries_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      health_profiles: {
        Row: {
          id: string;
          user_id: string;
          birth_date: string | null;
          gender: Gender | null;
          height: number | null;
          current_weight: number | null;
          goal_weight: number | null;
          starting_weight: number | null;
          unit_system: UnitSystem;
          tracking_enabled: boolean;
          current_bmi: number | null;
          starting_bmi: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          birth_date?: string | null;
          gender?: Gender | null;
          height?: number | null;
          current_weight?: number | null;
          goal_weight?: number | null;
          starting_weight?: number | null;
          unit_system?: UnitSystem;
          tracking_enabled?: boolean;
          current_bmi?: number | null;
          starting_bmi?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          birth_date?: string | null;
          gender?: Gender | null;
          height?: number | null;
          current_weight?: number | null;
          goal_weight?: number | null;
          starting_weight?: number | null;
          unit_system?: UnitSystem;
          tracking_enabled?: boolean;
          current_bmi?: number | null;
          starting_bmi?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "health_profiles_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      weight_history: {
        Row: {
          id: string;
          user_id: string;
          weight: number;
          bmi: number | null;
          notes: string | null;
          recorded_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          weight: number;
          bmi?: number | null;
          notes?: string | null;
          recorded_at?: string;
          created_at?: string;
        };
        Update: {
          weight?: number;
          bmi?: number | null;
          notes?: string | null;
          recorded_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "weight_history_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      badges: {
        Row: {
          id: string;
          name: string;
          description: string;
          icon_name: string;
          category: BadgeCategory;
          rarity: BadgeRarity;
          tier_required: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          description: string;
          icon_name: string;
          category: BadgeCategory;
          rarity?: BadgeRarity;
          tier_required?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          name?: string;
          description?: string;
          icon_name?: string;
          category?: BadgeCategory;
          rarity?: BadgeRarity;
          tier_required?: string | null;
          sort_order?: number;
        };
        Relationships: [];
      };
      user_badges: {
        Row: {
          id: string;
          user_id: string;
          badge_id: string;
          earned_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          badge_id: string;
          earned_at?: string;
        };
        Update: {
          earned_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_badges_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_badges_badge_id_fkey";
            columns: ["badge_id"];
            referencedRelation: "badges";
            referencedColumns: ["id"];
          }
        ];
      };
      public_profiles: {
        Row: {
          user_id: string;
          display_name: string;
          bio: string | null;
          avatar_url: string | null;
          is_public: boolean;
          show_streak: boolean;
          show_badges: boolean;
          show_progress: boolean;
          auto_share_badges: boolean;
          auto_share_milestones: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          display_name: string;
          bio?: string | null;
          avatar_url?: string | null;
          is_public?: boolean;
          show_streak?: boolean;
          show_badges?: boolean;
          show_progress?: boolean;
          auto_share_badges?: boolean;
          auto_share_milestones?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string;
          bio?: string | null;
          avatar_url?: string | null;
          is_public?: boolean;
          show_streak?: boolean;
          show_badges?: boolean;
          show_progress?: boolean;
          auto_share_badges?: boolean;
          auto_share_milestones?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "public_profiles_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      follows: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey";
            columns: ["follower_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "follows_following_id_fkey";
            columns: ["following_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      activity_posts: {
        Row: {
          id: string;
          user_id: string;
          post_type: PostType;
          content: string | null;
          metadata: Record<string, any>;
          visibility: PostVisibility;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_type: PostType;
          content?: string | null;
          metadata?: Record<string, any>;
          visibility?: PostVisibility;
          created_at?: string;
        };
        Update: {
          post_type?: PostType;
          content?: string | null;
          metadata?: Record<string, any>;
          visibility?: PostVisibility;
        };
        Relationships: [
          {
            foreignKeyName: "activity_posts_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      post_encouragements: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          emoji: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          emoji?: string;
          created_at?: string;
        };
        Update: {
          emoji?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_encouragements_post_id_fkey";
            columns: ["post_id"];
            referencedRelation: "activity_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "post_encouragements_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      subscription_plan: SubscriptionPlan;
      subscription_status: SubscriptionStatus;
      journal_entry_type: JournalEntryType;
      badge_category: BadgeCategory;
      badge_rarity: BadgeRarity;
      post_type: PostType;
      post_visibility: PostVisibility;
    };
  };
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Subscription = Database['public']['Tables']['subscriptions']['Row'];
export type UserProgress = Database['public']['Tables']['user_progress']['Row'];
export type QuizAttempt = Database['public']['Tables']['quiz_attempts']['Row'];
export type JournalEntry = Database['public']['Tables']['journal_entries']['Row'];
export type Milestone = Database['public']['Tables']['milestones']['Row'];

export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type SubscriptionInsert = Database['public']['Tables']['subscriptions']['Insert'];
export type UserProgressInsert = Database['public']['Tables']['user_progress']['Insert'];
export type QuizAttemptInsert = Database['public']['Tables']['quiz_attempts']['Insert'];
export type JournalEntryInsert = Database['public']['Tables']['journal_entries']['Insert'];
export type MilestoneInsert = Database['public']['Tables']['milestones']['Insert'];

export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type SubscriptionUpdate = Database['public']['Tables']['subscriptions']['Update'];
export type UserProgressUpdate = Database['public']['Tables']['user_progress']['Update'];
export type QuizAttemptUpdate = Database['public']['Tables']['quiz_attempts']['Update'];
export type JournalEntryUpdate = Database['public']['Tables']['journal_entries']['Update'];
export type MilestoneUpdate = Database['public']['Tables']['milestones']['Update'];
export type FoodEntry = Database['public']['Tables']['food_entries']['Row'];
export type FoodEntryInsert = Database['public']['Tables']['food_entries']['Insert'];
export type FoodEntryUpdate = Database['public']['Tables']['food_entries']['Update'];
export type HealthProfile = Database['public']['Tables']['health_profiles']['Row'];
export type HealthProfileInsert = Database['public']['Tables']['health_profiles']['Insert'];
export type HealthProfileUpdate = Database['public']['Tables']['health_profiles']['Update'];
export type WeightHistory = Database['public']['Tables']['weight_history']['Row'];
export type WeightHistoryInsert = Database['public']['Tables']['weight_history']['Insert'];
export type WeightHistoryUpdate = Database['public']['Tables']['weight_history']['Update'];
export type Badge = Database['public']['Tables']['badges']['Row'];
export type BadgeInsert = Database['public']['Tables']['badges']['Insert'];
export type BadgeUpdate = Database['public']['Tables']['badges']['Update'];
export type UserBadge = Database['public']['Tables']['user_badges']['Row'] & {
  badge?: Badge;
};
export type UserBadgeInsert = Database['public']['Tables']['user_badges']['Insert'];
export type UserBadgeUpdate = Database['public']['Tables']['user_badges']['Update'];

// Badge with earned status for UI
export interface BadgeWithEarnedStatus extends Badge {
  earned: boolean;
  earnedAt: string | null;
}

// Community types
export type PublicProfile = Database['public']['Tables']['public_profiles']['Row'];
export type PublicProfileInsert = Database['public']['Tables']['public_profiles']['Insert'];
export type PublicProfileUpdate = Database['public']['Tables']['public_profiles']['Update'];
export type Follow = Database['public']['Tables']['follows']['Row'];
export type FollowInsert = Database['public']['Tables']['follows']['Insert'];
export type ActivityPost = Database['public']['Tables']['activity_posts']['Row'];
export type ActivityPostInsert = Database['public']['Tables']['activity_posts']['Insert'];
export type ActivityPostUpdate = Database['public']['Tables']['activity_posts']['Update'];
export type PostEncouragement = Database['public']['Tables']['post_encouragements']['Row'];
export type PostEncouragementInsert = Database['public']['Tables']['post_encouragements']['Insert'];

// Activity feed item with user info and counts
export interface ActivityFeedItem extends ActivityPost {
  display_name: string;
  avatar_url: string | null;
  is_public: boolean;
  encouragement_count: number;
  has_encouraged: boolean;
}

// User community stats
export interface UserCommunityStats {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  is_public: boolean;
  follower_count: number;
  following_count: number;
  post_count: number;
}

// Nutrition-related types for API responses
export interface NutritionInfo {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  sugar: number | null;
  sodium: number | null;
}

export interface FoodProduct {
  barcode: string;
  name: string;
  brand: string | null;
  servingSize: number | null;
  servingUnit: string | null;
  nutrition: NutritionInfo;
  imageUrl: string | null;
}

export interface DailyNutritionSummary {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  totalSugar: number;
  totalSodium: number;
  entryCount: number;
}
