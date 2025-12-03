/*
  # Add Total Points to User Profiles

  1. Changes
    - Add `total_points` column to `user_profiles` table
    - Default value is 0
    - Track cumulative points for leaderboard calculations

  2. Notes
    - This field will be used to calculate cost per point ratio for rankings
    - Lower cost per point = better ranking
    - In case of tie, lower team_value wins
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'total_points'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN total_points integer DEFAULT 0 NOT NULL;
  END IF;
END $$;
