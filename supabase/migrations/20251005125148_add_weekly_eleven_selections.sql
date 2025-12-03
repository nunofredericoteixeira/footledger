/*
  # Add Weekly Eleven Selections

  1. New Tables
    - `weekly_eleven_selections`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `week_start_date` (date) - Tuesday of the week
      - `week_end_date` (date) - Monday of the following week
      - `starting_eleven` (jsonb) - Array of 11 player objects
      - `substitutes` (jsonb) - Array of 5 substitute player objects
      - `tactic_name` (text) - Formation name used
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `weekly_eleven_selections` table
    - Add policies for authenticated users to manage their own weekly selections

  3. Constraints
    - Unique constraint on user_id + week_start_date to prevent duplicate submissions
*/

CREATE TABLE IF NOT EXISTS weekly_eleven_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_start_date date NOT NULL,
  week_end_date date NOT NULL,
  starting_eleven jsonb NOT NULL,
  substitutes jsonb NOT NULL,
  tactic_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_start_date)
);

ALTER TABLE weekly_eleven_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own weekly selections"
  ON weekly_eleven_selections
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weekly selections"
  ON weekly_eleven_selections
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weekly selections"
  ON weekly_eleven_selections
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own weekly selections"
  ON weekly_eleven_selections
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_weekly_eleven_user_week 
  ON weekly_eleven_selections(user_id, week_start_date);
