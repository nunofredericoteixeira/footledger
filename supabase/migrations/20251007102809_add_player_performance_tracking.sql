/*
  # Add Player Performance Tracking System

  1. New Tables
    - `player_performance_data`
      - `id` (uuid, primary key)
      - `player_name` (text) - Nome do jogador
      - `match_date` (date) - Data do jogo (coluna A do Excel)
      - `performance_score` (decimal) - Pontuação do jogo (coluna U do Excel)
      - `season` (text) - Época (ex: "2025-2026")
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Changes to existing tables
    - Add `week_start_date` and `week_end_date` to `weekly_eleven_selections`
      - Para definir o período da semana (terça a segunda)
    - Add `calculated_points` to `weekly_eleven_selections`
      - Pontos calculados automaticamente para aquela seleção
  
  3. Security
    - Enable RLS on `player_performance_data`
    - Admins can insert/update performance data
    - All authenticated users can read performance data
    - Add policies for automatic point calculation

  4. Functions
    - Function to calculate points for a weekly eleven selection
    - Trigger to recalculate points when performance data is updated
*/

-- Create player_performance_data table
CREATE TABLE IF NOT EXISTS player_performance_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name text NOT NULL,
  match_date date NOT NULL,
  performance_score decimal(10,2) NOT NULL DEFAULT 0,
  season text NOT NULL DEFAULT '2025-2026',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(player_name, match_date, season)
);

-- Add indexes for performance queries
CREATE INDEX IF NOT EXISTS idx_player_performance_name ON player_performance_data(player_name);
CREATE INDEX IF NOT EXISTS idx_player_performance_date ON player_performance_data(match_date);
CREATE INDEX IF NOT EXISTS idx_player_performance_season ON player_performance_data(season);

-- Add week dates to weekly_eleven_selections
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weekly_eleven_selections' AND column_name = 'week_start_date'
  ) THEN
    ALTER TABLE weekly_eleven_selections ADD COLUMN week_start_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weekly_eleven_selections' AND column_name = 'week_end_date'
  ) THEN
    ALTER TABLE weekly_eleven_selections ADD COLUMN week_end_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weekly_eleven_selections' AND column_name = 'calculated_points'
  ) THEN
    ALTER TABLE weekly_eleven_selections ADD COLUMN calculated_points decimal(10,2) DEFAULT 0;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE player_performance_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for player_performance_data
CREATE POLICY "Authenticated users can view performance data"
  ON player_performance_data
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert performance data"
  ON player_performance_data
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update performance data"
  ON player_performance_data
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

CREATE POLICY "Admins can delete performance data"
  ON player_performance_data
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Function to calculate points for a weekly eleven selection
CREATE OR REPLACE FUNCTION calculate_weekly_eleven_points(selection_id uuid)
RETURNS decimal AS $$
DECLARE
  total_points decimal := 0;
  selection_record RECORD;
  starter_points decimal;
  substitute_points decimal;
  player_name_clean text;
BEGIN
  -- Get the selection with week dates
  SELECT * INTO selection_record
  FROM weekly_eleven_selections
  WHERE id = selection_id;

  IF NOT FOUND OR selection_record.week_start_date IS NULL OR selection_record.week_end_date IS NULL THEN
    RETURN 0;
  END IF;

  -- Calculate points for starting eleven (100% of performance score)
  FOR player_name_clean IN
    SELECT DISTINCT unnest(selection_record.selected_players) AS player
  LOOP
    SELECT COALESCE(SUM(performance_score), 0) INTO starter_points
    FROM player_performance_data
    WHERE player_name = player_name_clean
      AND match_date >= selection_record.week_start_date
      AND match_date <= selection_record.week_end_date
      AND season = '2025-2026';
    
    total_points := total_points + starter_points;
  END LOOP;

  -- Calculate points for substitutes (50% of performance score)
  FOR player_name_clean IN
    SELECT DISTINCT unnest(selection_record.substitute_players) AS player
  LOOP
    SELECT COALESCE(SUM(performance_score), 0) INTO substitute_points
    FROM player_performance_data
    WHERE player_name = player_name_clean
      AND match_date >= selection_record.week_start_date
      AND match_date <= selection_record.week_end_date
      AND season = '2025-2026';
    
    total_points := total_points + (substitute_points * 0.5);
  END LOOP;

  -- Update the calculated points in the selection
  UPDATE weekly_eleven_selections
  SET calculated_points = total_points
  WHERE id = selection_id;

  RETURN total_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to recalculate all active weekly selections
CREATE OR REPLACE FUNCTION recalculate_all_weekly_points()
RETURNS void AS $$
DECLARE
  selection_record RECORD;
BEGIN
  FOR selection_record IN
    SELECT id FROM weekly_eleven_selections
    WHERE week_start_date IS NOT NULL AND week_end_date IS NOT NULL
  LOOP
    PERFORM calculate_weekly_eleven_points(selection_record.id);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to recalculate points when performance data is updated
CREATE OR REPLACE FUNCTION trigger_recalculate_points()
RETURNS trigger AS $$
BEGIN
  PERFORM recalculate_all_weekly_points();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_performance_data_change
  AFTER INSERT OR UPDATE OR DELETE ON player_performance_data
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_recalculate_points();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_player_performance_updated_at
  BEFORE UPDATE ON player_performance_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();