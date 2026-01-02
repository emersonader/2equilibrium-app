-- Holistic Wellness Journey Database Schema
-- Run this in your Supabase SQL Editor

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CUSTOM TYPES
-- ============================================
CREATE TYPE subscription_plan AS ENUM ('foundation', 'transformation', 'lifetime');
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'lapsed', 'cancelled');
CREATE TYPE journal_entry_type AS ENUM ('daily', 'weekly_review', 'freeform');

-- ============================================
-- PROFILES TABLE
-- Extends Supabase auth.users with app-specific data
-- ============================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  notification_preferences JSONB DEFAULT '{
    "morningWisdom": true,
    "lessonReminder": true,
    "gentleNudge": true,
    "streakReminder": true,
    "weeklyReview": true,
    "quietHoursStart": "22:00",
    "quietHoursEnd": "07:00"
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SUBSCRIPTIONS TABLE
-- Synced from RevenueCat webhook
-- ============================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan subscription_plan NOT NULL,
  status subscription_status NOT NULL,
  trial_end_date TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  revenuecat_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one active subscription per user
  CONSTRAINT unique_active_subscription UNIQUE (user_id)
);

-- ============================================
-- USER PROGRESS TABLE
-- Tracks journey progress, streaks, badges
-- ============================================
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_phase INTEGER DEFAULT 1 CHECK (current_phase >= 1 AND current_phase <= 4),
  current_chapter INTEGER DEFAULT 1 CHECK (current_chapter >= 1 AND current_chapter <= 6),
  current_day INTEGER DEFAULT 1 CHECK (current_day >= 1 AND current_day <= 365),
  subscription_start_date TIMESTAMPTZ,
  completed_lessons TEXT[] DEFAULT '{}',
  badges TEXT[] DEFAULT '{}',
  current_streak INTEGER DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak INTEGER DEFAULT 0 CHECK (longest_streak >= 0),
  last_active_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- QUIZ ATTEMPTS TABLE
-- Records all quiz attempts for each chapter
-- ============================================
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  chapter_id TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  passed BOOLEAN NOT NULL,
  missed_topics TEXT[] DEFAULT '{}',
  can_retry_at TIMESTAMPTZ,
  attempted_at TIMESTAMPTZ DEFAULT NOW(),

  -- Index for querying user's attempts
  CONSTRAINT quiz_attempts_user_chapter_idx UNIQUE (user_id, chapter_id, attempted_at)
);

-- ============================================
-- JOURNAL ENTRIES TABLE
-- Daily reflections and tracking
-- ============================================
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  lesson_id TEXT,
  entry_date DATE NOT NULL,
  entry_type journal_entry_type NOT NULL,
  prompt_response TEXT,
  reflection_response TEXT,
  gratitude_response TEXT,
  freeform_notes TEXT,
  mood INTEGER CHECK (mood >= 1 AND mood <= 5),
  energy INTEGER CHECK (energy >= 1 AND energy <= 5),
  nourishment_quality INTEGER CHECK (nourishment_quality >= 1 AND nourishment_quality <= 5),
  movement_completed BOOLEAN,
  water_intake INTEGER CHECK (water_intake >= 0 AND water_intake <= 20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One entry per day per type
  CONSTRAINT unique_daily_entry UNIQUE (user_id, entry_date, entry_type)
);

-- ============================================
-- MILESTONES TABLE
-- Achievement tracking
-- ============================================
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  milestone_type TEXT NOT NULL,
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  shared BOOLEAN DEFAULT FALSE,

  -- Each milestone can only be achieved once
  CONSTRAINT unique_milestone UNIQUE (user_id, milestone_type)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_chapter_id ON quiz_attempts(chapter_id);
CREATE INDEX idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX idx_journal_entries_date ON journal_entries(entry_date);
CREATE INDEX idx_milestones_user_id ON milestones(user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: PROFILES
-- ============================================
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- RLS POLICIES: SUBSCRIPTIONS
-- ============================================
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Note: Insert/Update handled by server-side (RevenueCat webhook)
-- Add service role policy if needed for webhook

-- ============================================
-- RLS POLICIES: USER PROGRESS
-- ============================================
CREATE POLICY "Users can view own progress"
  ON user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES: QUIZ ATTEMPTS
-- ============================================
CREATE POLICY "Users can view own quiz attempts"
  ON quiz_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz attempts"
  ON quiz_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES: JOURNAL ENTRIES
-- ============================================
CREATE POLICY "Users can view own journal entries"
  ON journal_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal entries"
  ON journal_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries"
  ON journal_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries"
  ON journal_entries FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES: MILESTONES
-- ============================================
CREATE POLICY "Users can view own milestones"
  ON milestones FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own milestones"
  ON milestones FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own milestones"
  ON milestones FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS: AUTO-UPDATE TIMESTAMPS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON user_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TRIGGER: AUTO-CREATE PROFILE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );

  -- Also create initial progress record
  INSERT INTO user_progress (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- FUNCTION: UPDATE STREAK
-- ============================================
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_last_active DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
BEGIN
  -- Get current values
  SELECT last_active_date, current_streak, longest_streak
  INTO v_last_active, v_current_streak, v_longest_streak
  FROM user_progress
  WHERE user_id = p_user_id;

  -- If no record exists, do nothing
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Calculate new streak
  IF v_last_active IS NULL THEN
    -- First activity
    v_current_streak := 1;
  ELSIF v_last_active = CURRENT_DATE THEN
    -- Already active today, no change
    RETURN;
  ELSIF v_last_active = CURRENT_DATE - INTERVAL '1 day' THEN
    -- Consecutive day
    v_current_streak := v_current_streak + 1;
  ELSE
    -- Streak broken
    v_current_streak := 1;
  END IF;

  -- Update longest streak if needed
  IF v_current_streak > v_longest_streak THEN
    v_longest_streak := v_current_streak;
  END IF;

  -- Update the record
  UPDATE user_progress
  SET
    current_streak = v_current_streak,
    longest_streak = v_longest_streak,
    last_active_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: CHECK QUIZ RETRY ELIGIBILITY
-- ============================================
CREATE OR REPLACE FUNCTION can_retry_quiz(
  p_user_id UUID,
  p_chapter_id TEXT,
  p_subscription_plan subscription_plan
)
RETURNS BOOLEAN AS $$
DECLARE
  v_can_retry_at TIMESTAMPTZ;
BEGIN
  -- Get the most recent failed attempt
  SELECT can_retry_at
  INTO v_can_retry_at
  FROM quiz_attempts
  WHERE user_id = p_user_id
    AND chapter_id = p_chapter_id
    AND passed = FALSE
  ORDER BY attempted_at DESC
  LIMIT 1;

  -- If no failed attempts, can take quiz
  IF NOT FOUND THEN
    RETURN TRUE;
  END IF;

  -- Lifetime users can retry immediately
  IF p_subscription_plan = 'lifetime' THEN
    RETURN TRUE;
  END IF;

  -- Others must wait until can_retry_at
  IF v_can_retry_at IS NULL OR v_can_retry_at <= NOW() THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
