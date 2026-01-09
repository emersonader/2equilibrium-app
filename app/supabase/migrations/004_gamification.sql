-- Gamification System Database Schema
-- Badges and Achievements for 2Equilibrium Wellness App

-- ============================================
-- CUSTOM TYPES
-- ============================================
CREATE TYPE badge_category AS ENUM ('streak', 'chapter', 'milestone', 'special');
CREATE TYPE badge_rarity AS ENUM ('common', 'rare', 'epic', 'legendary');

-- ============================================
-- BADGES TABLE
-- Static catalog of all available badges
-- ============================================
CREATE TABLE badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  category badge_category NOT NULL,
  rarity badge_rarity DEFAULT 'common',
  tier_required TEXT DEFAULT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER BADGES TABLE
-- Tracks which badges each user has earned
-- ============================================
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  badge_id TEXT REFERENCES badges(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),

  -- Each user can only earn each badge once
  CONSTRAINT unique_user_badge UNIQUE (user_id, badge_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge ON user_badges(badge_id);
CREATE INDEX idx_user_badges_earned ON user_badges(earned_at DESC);
CREATE INDEX idx_badges_category ON badges(category);
CREATE INDEX idx_badges_rarity ON badges(rarity);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Badges table (public read)
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badges are viewable by everyone"
  ON badges FOR SELECT
  USING (true);

-- User badges table (public read for leaderboards, users can earn)
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User badges are viewable by everyone"
  ON user_badges FOR SELECT
  USING (true);

CREATE POLICY "Users can earn their own badges"
  ON user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- SEED BADGE CATALOG
-- ============================================

-- Streak badges
INSERT INTO badges (id, name, description, icon_name, category, rarity, sort_order) VALUES
  ('streak_3', 'Getting Started', 'Maintain a 3-day streak', 'flame-outline', 'streak', 'common', 10),
  ('streak_7', 'Week Warrior', 'Maintain a 7-day streak', 'flame', 'streak', 'common', 20),
  ('streak_14', 'Fortnight Focus', 'Maintain a 14-day streak', 'bonfire-outline', 'streak', 'rare', 30),
  ('streak_30', 'Monthly Master', 'Maintain a 30-day streak', 'bonfire', 'streak', 'epic', 40),
  ('streak_60', 'Dedication', 'Maintain a 60-day streak', 'trophy-outline', 'streak', 'epic', 50),
  ('streak_90', 'Transformation', 'Maintain a 90-day streak', 'trophy', 'streak', 'legendary', 60);

-- Chapter completion badges
INSERT INTO badges (id, name, description, icon_name, category, rarity, sort_order) VALUES
  ('chapter_1', 'Awakening', 'Complete Chapter 1: Awakening Your Wellness Path', 'sunny-outline', 'chapter', 'common', 100),
  ('chapter_2', 'Nourished', 'Complete Chapter 2: Nourishment Fundamentals', 'leaf-outline', 'chapter', 'common', 110),
  ('chapter_3', 'Mindful', 'Complete Chapter 3: Mindful Eating Rituals', 'eye-outline', 'chapter', 'rare', 120),
  ('chapter_4', 'Architect', 'Complete Chapter 4: Meal Architecture', 'construct-outline', 'chapter', 'rare', 130),
  ('chapter_5', 'In Motion', 'Complete Chapter 5: Gentle Movement Foundations', 'walk-outline', 'chapter', 'epic', 140),
  ('chapter_6', 'Mindset Master', 'Complete Chapter 6: Mindset & Self-Compassion', 'heart-outline', 'chapter', 'epic', 150);

-- Milestone badges
INSERT INTO badges (id, name, description, icon_name, category, rarity, sort_order) VALUES
  ('first_lesson', 'First Step', 'Complete your first lesson', 'footsteps-outline', 'milestone', 'common', 200),
  ('phase_1', 'Foundation Complete', 'Complete all 30 days of Phase 1', 'ribbon', 'milestone', 'legendary', 210),
  ('first_journal', 'Reflector', 'Write your first journal entry', 'book-outline', 'milestone', 'common', 220),
  ('journal_7', 'Week of Reflection', 'Write 7 journal entries', 'journal-outline', 'milestone', 'common', 230),
  ('journal_30', 'Monthly Journaler', 'Write 30 journal entries', 'library-outline', 'milestone', 'rare', 240);

-- Special badges
INSERT INTO badges (id, name, description, icon_name, category, rarity, sort_order) VALUES
  ('quiz_perfect', 'Perfect Score', 'Score 100% on any chapter quiz', 'star', 'special', 'rare', 300),
  ('early_bird', 'Early Bird', 'Complete a lesson before 8am', 'partly-sunny-outline', 'special', 'rare', 310),
  ('night_owl', 'Night Owl', 'Complete a lesson after 10pm', 'moon-outline', 'special', 'rare', 320),
  ('weekend_warrior', 'Weekend Warrior', 'Complete lessons on both Saturday and Sunday', 'calendar-outline', 'special', 'rare', 330),
  ('comeback', 'Comeback', 'Return after 7+ days away and complete a lesson', 'refresh-outline', 'special', 'rare', 340);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if user has a specific badge
CREATE OR REPLACE FUNCTION has_badge(p_user_id UUID, p_badge_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_badges
    WHERE user_id = p_user_id AND badge_id = p_badge_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to award a badge (idempotent - won't duplicate)
CREATE OR REPLACE FUNCTION award_badge(p_user_id UUID, p_badge_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  badge_exists BOOLEAN;
BEGIN
  -- Check if badge exists in catalog
  SELECT EXISTS (SELECT 1 FROM badges WHERE id = p_badge_id) INTO badge_exists;

  IF NOT badge_exists THEN
    RETURN FALSE;
  END IF;

  -- Try to insert (will silently fail if already exists due to unique constraint)
  INSERT INTO user_badges (user_id, badge_id)
  VALUES (p_user_id, p_badge_id)
  ON CONFLICT (user_id, badge_id) DO NOTHING;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's badge count by rarity
CREATE OR REPLACE FUNCTION get_badge_stats(p_user_id UUID)
RETURNS TABLE (
  total_badges INTEGER,
  common_badges INTEGER,
  rare_badges INTEGER,
  epic_badges INTEGER,
  legendary_badges INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_badges,
    COUNT(*) FILTER (WHERE b.rarity = 'common')::INTEGER as common_badges,
    COUNT(*) FILTER (WHERE b.rarity = 'rare')::INTEGER as rare_badges,
    COUNT(*) FILTER (WHERE b.rarity = 'epic')::INTEGER as epic_badges,
    COUNT(*) FILTER (WHERE b.rarity = 'legendary')::INTEGER as legendary_badges
  FROM user_badges ub
  JOIN badges b ON ub.badge_id = b.id
  WHERE ub.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
