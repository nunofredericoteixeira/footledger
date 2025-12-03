/*
  # Create Player Pool and User Selections

  1. New Tables
    - `player_pool`
      - `id` (uuid, primary key)
      - `name` (text) - Player full name
      - `league` (text) - League name
      - `club` (text) - Club/team name
      - `position` (text) - Playing position
      - `value` (numeric) - Player market value
      - `url` (text, nullable) - Optional reference URL
      - `created_at` (timestamptz)
    
    - `user_player_selections`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `player_id` (uuid, foreign key to player_pool)
      - `created_at` (timestamptz)
      - Unique combination of user_id and player_id

  2. Security
    - Enable RLS on both tables
    - Player pool: Public read access for authenticated users
    - User selections: Users can only read/write their own selections

  3. Notes
    - Position requirements (3 GK, 2 per other position) enforced at app level
    - Budget tracking added to user_profiles table
*/

-- Create player_pool table
CREATE TABLE IF NOT EXISTS player_pool (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  league text NOT NULL,
  club text NOT NULL,
  position text NOT NULL,
  value numeric NOT NULL DEFAULT 0,
  url text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_player_pool_position ON player_pool(position);
CREATE INDEX IF NOT EXISTS idx_player_pool_club ON player_pool(club);
CREATE INDEX IF NOT EXISTS idx_player_pool_league ON player_pool(league);
CREATE INDEX IF NOT EXISTS idx_player_pool_value ON player_pool(value DESC);
CREATE INDEX IF NOT EXISTS idx_player_pool_name ON player_pool(name);

-- Create user_player_selections table
CREATE TABLE IF NOT EXISTS user_player_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES player_pool(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, player_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_player_selections_user ON user_player_selections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_player_selections_player ON user_player_selections(player_id);

-- Enable RLS
ALTER TABLE player_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_player_selections ENABLE ROW LEVEL SECURITY;

-- Player pool policies: All authenticated users can read
CREATE POLICY "Authenticated users can view player pool"
  ON player_pool
  FOR SELECT
  TO authenticated
  USING (true);

-- User player selections policies
CREATE POLICY "Users can view own player selections"
  ON user_player_selections
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own player selections"
  ON user_player_selections
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own player selections"
  ON user_player_selections
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add columns to user_profiles for budget tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'remaining_budget'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN remaining_budget numeric DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'players_locked'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN players_locked boolean DEFAULT false;
  END IF;
END $$;

-- Set remaining_budget to team_value for existing users
UPDATE user_profiles 
SET remaining_budget = team_value 
WHERE remaining_budget = 0 AND team_value > 0;
