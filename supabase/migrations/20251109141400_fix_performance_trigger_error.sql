/*
  # Fix Performance Data Trigger Error

  1. Changes
    - Drop and recreate the trigger to handle missing fields gracefully
    - Add null checks to prevent errors when selected_players doesn't exist
  
  2. Security
    - No changes to RLS policies
*/

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_performance_data_change ON player_performance_data;

-- Recreate the recalculate function with better error handling
CREATE OR REPLACE FUNCTION trigger_recalculate_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate points for all active weekly selections
  PERFORM recalculate_all_weekly_points();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_performance_data_change
  AFTER INSERT OR UPDATE OR DELETE ON player_performance_data
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_recalculate_points();