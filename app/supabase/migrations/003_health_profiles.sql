-- Health Profiles and Weight Tracking
-- Stores user health information for BMI calculation and weight tracking

-- Health profiles table
CREATE TABLE health_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- Personal info
  birth_date DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),

  -- Measurements
  height REAL, -- stored in cm (converted from imperial if needed)
  current_weight REAL, -- stored in kg (converted from imperial if needed)
  goal_weight REAL, -- stored in kg
  starting_weight REAL, -- stored in kg (first recorded weight)

  -- Preferences
  unit_system TEXT DEFAULT 'metric' CHECK (unit_system IN ('metric', 'imperial')),
  tracking_enabled BOOLEAN DEFAULT false,

  -- Calculated fields (updated when weight changes)
  current_bmi REAL,
  starting_bmi REAL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weight history table for tracking progress over time
CREATE TABLE weight_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  weight REAL NOT NULL, -- stored in kg
  bmi REAL, -- calculated at time of entry
  notes TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_health_profiles_user_id ON health_profiles(user_id);
CREATE INDEX idx_weight_history_user_id ON weight_history(user_id);
CREATE INDEX idx_weight_history_recorded_at ON weight_history(user_id, recorded_at DESC);

-- RLS Policies
ALTER TABLE health_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_history ENABLE ROW LEVEL SECURITY;

-- Health profiles policies
CREATE POLICY "Users can view their own health profile"
  ON health_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own health profile"
  ON health_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health profile"
  ON health_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own health profile"
  ON health_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Weight history policies
CREATE POLICY "Users can view their own weight history"
  ON weight_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weight entries"
  ON weight_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weight entries"
  ON weight_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weight entries"
  ON weight_history FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_health_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER health_profiles_updated_at
  BEFORE UPDATE ON health_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_health_profile_timestamp();
