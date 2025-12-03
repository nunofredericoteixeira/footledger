/*
  # Add Service Role Policies for Performance Data

  1. Changes
    - Add policies to allow service_role to bypass RLS on player_performance_data
    - This enables edge functions using service role key to insert data directly
  
  2. Security
    - Service role policies only apply when using SUPABASE_SERVICE_ROLE_KEY
    - Existing authenticated user policies remain unchanged
*/

-- Add service role policies for player_performance_data
CREATE POLICY "Service role can insert performance data"
  ON player_performance_data
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update performance data"
  ON player_performance_data
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can delete performance data"
  ON player_performance_data
  FOR DELETE
  TO service_role
  USING (true);

CREATE POLICY "Service role can view performance data"
  ON player_performance_data
  FOR SELECT
  TO service_role
  USING (true);