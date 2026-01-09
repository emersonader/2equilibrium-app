-- Community Features Database Schema
-- Activity Feed, Follows, and Social Interactions for 2Equilibrium Wellness App

-- ============================================
-- CUSTOM TYPES
-- ============================================
CREATE TYPE post_type AS ENUM ('milestone', 'badge', 'streak', 'chapter', 'custom');
CREATE TYPE post_visibility AS ENUM ('public', 'followers', 'private');

-- ============================================
-- PUBLIC PROFILES TABLE
-- Separate from private profiles for community visibility control
-- ============================================
CREATE TABLE public_profiles (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  is_public BOOLEAN DEFAULT true,
  show_streak BOOLEAN DEFAULT true,
  show_badges BOOLEAN DEFAULT true,
  show_progress BOOLEAN DEFAULT false,
  auto_share_badges BOOLEAN DEFAULT true,
  auto_share_milestones BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FOLLOWS TABLE
-- User follow relationships
-- ============================================
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Each user can only follow another user once
  CONSTRAINT unique_follow UNIQUE (follower_id, following_id),
  -- Users cannot follow themselves
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- ============================================
-- ACTIVITY POSTS TABLE
-- Social feed posts for sharing achievements
-- ============================================
CREATE TABLE activity_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_type post_type NOT NULL,
  content TEXT,
  metadata JSONB DEFAULT '{}',
  visibility post_visibility DEFAULT 'public',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- POST ENCOURAGEMENTS TABLE
-- Likes/encouragements on posts
-- ============================================
CREATE TABLE post_encouragements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES activity_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  emoji TEXT DEFAULT '❤️',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Each user can only encourage a post once
  CONSTRAINT unique_encouragement UNIQUE (post_id, user_id)
);

-- ============================================
-- INDEXES
-- ============================================

-- Public profiles
CREATE INDEX idx_public_profiles_is_public ON public_profiles(is_public);

-- Follows
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

-- Activity posts
CREATE INDEX idx_activity_posts_user ON activity_posts(user_id);
CREATE INDEX idx_activity_posts_created ON activity_posts(created_at DESC);
CREATE INDEX idx_activity_posts_visibility ON activity_posts(visibility);
CREATE INDEX idx_activity_posts_type ON activity_posts(post_type);

-- Encouragements
CREATE INDEX idx_encouragements_post ON post_encouragements(post_id);
CREATE INDEX idx_encouragements_user ON post_encouragements(user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Public profiles
ALTER TABLE public_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles viewable by all authenticated users"
  ON public_profiles FOR SELECT
  TO authenticated
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert own public profile"
  ON public_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own public profile"
  ON public_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own public profile"
  ON public_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Follows
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follows viewable by all authenticated users"
  ON follows FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create follows"
  ON follows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete own follows"
  ON follows FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

-- Activity posts
ALTER TABLE activity_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts viewable based on visibility"
  ON activity_posts FOR SELECT
  TO authenticated
  USING (
    visibility = 'public'
    OR auth.uid() = user_id
    OR (visibility = 'followers' AND EXISTS (
      SELECT 1 FROM follows
      WHERE follower_id = auth.uid() AND following_id = activity_posts.user_id
    ))
  );

CREATE POLICY "Users can create own posts"
  ON activity_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON activity_posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON activity_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Post encouragements
ALTER TABLE post_encouragements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Encouragements viewable by all authenticated users"
  ON post_encouragements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create encouragements"
  ON post_encouragements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own encouragements"
  ON post_encouragements FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get follower count
CREATE OR REPLACE FUNCTION get_follower_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER FROM follows WHERE following_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get following count
CREATE OR REPLACE FUNCTION get_following_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER FROM follows WHERE follower_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is following another
CREATE OR REPLACE FUNCTION is_following(p_follower_id UUID, p_following_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM follows
    WHERE follower_id = p_follower_id AND following_id = p_following_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get post encouragement count
CREATE OR REPLACE FUNCTION get_encouragement_count(p_post_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER FROM post_encouragements WHERE post_id = p_post_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user encouraged a post
CREATE OR REPLACE FUNCTION has_encouraged(p_user_id UUID, p_post_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM post_encouragements
    WHERE user_id = p_user_id AND post_id = p_post_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at for public_profiles
CREATE OR REPLACE FUNCTION update_public_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER public_profiles_updated_at
  BEFORE UPDATE ON public_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_public_profile_updated_at();

-- ============================================
-- AUTO-CREATE PUBLIC PROFILE
-- When a profile is created, create a public profile
-- ============================================
CREATE OR REPLACE FUNCTION create_public_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public_profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.full_name, 'Wellness Seeker'))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created_create_public
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_public_profile_on_signup();

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View for activity feed with user info and counts
CREATE OR REPLACE VIEW activity_feed_view AS
SELECT
  ap.id,
  ap.user_id,
  ap.post_type,
  ap.content,
  ap.metadata,
  ap.visibility,
  ap.created_at,
  pp.display_name,
  pp.avatar_url,
  pp.is_public,
  (SELECT COUNT(*)::INTEGER FROM post_encouragements pe WHERE pe.post_id = ap.id) as encouragement_count
FROM activity_posts ap
JOIN public_profiles pp ON ap.user_id = pp.user_id
WHERE pp.is_public = true OR ap.visibility = 'public';

-- View for user community stats
CREATE OR REPLACE VIEW user_community_stats AS
SELECT
  pp.user_id,
  pp.display_name,
  pp.avatar_url,
  pp.is_public,
  (SELECT COUNT(*)::INTEGER FROM follows f WHERE f.following_id = pp.user_id) as follower_count,
  (SELECT COUNT(*)::INTEGER FROM follows f WHERE f.follower_id = pp.user_id) as following_count,
  (SELECT COUNT(*)::INTEGER FROM activity_posts ap WHERE ap.user_id = pp.user_id) as post_count
FROM public_profiles pp;
