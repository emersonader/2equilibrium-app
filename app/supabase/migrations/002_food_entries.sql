-- Food Entries Table for Nutrition Tracking
-- Created: 2026-01-01

-- Create meal_type enum
DO $$ BEGIN
  CREATE TYPE meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create food_entries table
CREATE TABLE IF NOT EXISTS food_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  meal_type meal_type NOT NULL,
  food_name TEXT NOT NULL,
  brand TEXT,
  barcode TEXT,
  serving_size REAL,
  serving_unit TEXT,
  calories REAL,
  protein REAL,
  carbs REAL,
  fat REAL,
  fiber REAL,
  sugar REAL,
  sodium REAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries by user and date
CREATE INDEX IF NOT EXISTS idx_food_entries_user_date
ON food_entries(user_id, entry_date);

-- Create index for barcode lookups
CREATE INDEX IF NOT EXISTS idx_food_entries_barcode
ON food_entries(barcode) WHERE barcode IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE food_entries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own food entries
CREATE POLICY "Users can view own food entries"
ON food_entries FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own food entries
CREATE POLICY "Users can insert own food entries"
ON food_entries FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own food entries
CREATE POLICY "Users can update own food entries"
ON food_entries FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own food entries
CREATE POLICY "Users can delete own food entries"
ON food_entries FOR DELETE
USING (auth.uid() = user_id);

-- Grant permissions to authenticated users
GRANT ALL ON food_entries TO authenticated;
