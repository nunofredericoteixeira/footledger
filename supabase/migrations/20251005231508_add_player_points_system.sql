/*
  # Add Player Points System

  1. New Tables
    - `player_weekly_points`
      - `id` (uuid, primary key)
      - `player_id` (uuid, foreign key to player_pool)
      - `week_start_date` (date) - Tuesday of the week
      - `points` (integer) - Points earned in that week
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `user_player_total_points`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `player_id` (uuid, foreign key to player_pool)
      - `total_points` (integer) - Cumulative points
      - `last_week_points` (integer) - Points from last completed week
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users

  3. Indexes
    - Index on player_id and week_start_date for fast lookups
    - Index on user_id for user-specific queries
*/

CREATE TABLE IF NOT EXISTS player_weekly_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES player_pool(id) ON DELETE CASCADE NOT NULL,
  week_start_date date NOT NULL,
  points integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(player_id, week_start_date)
);

CREATE TABLE IF NOT EXISTS user_player_total_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  player_id uuid REFERENCES player_pool(id) ON DELETE CASCADE NOT NULL,
  total_points integer DEFAULT 0 NOT NULL,
  last_week_points integer DEFAULT 0 NOT NULL,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, player_id)
);

ALTER TABLE player_weekly_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_player_total_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view weekly points"
  ON player_weekly_points
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert weekly points"
  ON player_weekly_points
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update weekly points"
  ON player_weekly_points
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Users can view own player points"
  ON user_player_total_points
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own player points"
  ON user_player_total_points
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own player points"
  ON user_player_total_points
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_player_weekly_points_player_week 
  ON player_weekly_points(player_id, week_start_date);

CREATE INDEX IF NOT EXISTS idx_user_player_total_points_user 
  ON user_player_total_points(user_id);

CREATE INDEX IF NOT EXISTS idx_user_player_total_points_player 
  ON user_player_total_points(player_id);
