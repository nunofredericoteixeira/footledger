/*
  # Allow public read of player performance data

  Top Players screen reads `player_performance_data` with the anon key, so we need a SELECT policy.
*/

-- Ensure table exists and RLS is enabled (safe if already enabled)
ALTER TABLE player_performance_data ENABLE ROW LEVEL SECURITY;

-- Public SELECT
CREATE POLICY "Anyone can view player_performance_data"
  ON player_performance_data
  FOR SELECT
  USING (true);
