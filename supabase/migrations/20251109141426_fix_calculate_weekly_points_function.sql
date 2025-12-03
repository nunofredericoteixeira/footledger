/*
  # Fix Calculate Weekly Points Function

  1. Changes
    - Update calculate_weekly_eleven_points to use correct column names
    - Change from selected_players/substitute_players to starting_eleven/substitutes
    - Handle JSONB structure correctly
  
  2. Security
    - No changes to RLS policies
*/

-- Drop and recreate the function with correct column names
CREATE OR REPLACE FUNCTION calculate_weekly_eleven_points(selection_id uuid)
RETURNS decimal AS $$
DECLARE
  total_points decimal := 0;
  selection_record RECORD;
  starter_points decimal;
  substitute_points decimal;
  player_obj jsonb;
BEGIN
  -- Get the selection with week dates
  SELECT * INTO selection_record
  FROM weekly_eleven_selections
  WHERE id = selection_id;

  IF NOT FOUND OR selection_record.week_start_date IS NULL OR selection_record.week_end_date IS NULL THEN
    RETURN 0;
  END IF;

  -- Calculate points for starting eleven (100% of performance score)
  IF selection_record.starting_eleven IS NOT NULL THEN
    FOR player_obj IN SELECT * FROM jsonb_array_elements(selection_record.starting_eleven)
    LOOP
      SELECT COALESCE(SUM(performance_score), 0) INTO starter_points
      FROM player_performance_data
      WHERE player_name = player_obj->>'name'
        AND match_date >= selection_record.week_start_date
        AND match_date <= selection_record.week_end_date
        AND season = '2025-2026';
      
      total_points := total_points + starter_points;
    END LOOP;
  END IF;

  -- Calculate points for substitutes (50% of performance score)
  IF selection_record.substitutes IS NOT NULL THEN
    FOR player_obj IN SELECT * FROM jsonb_array_elements(selection_record.substitutes)
    LOOP
      SELECT COALESCE(SUM(performance_score), 0) INTO substitute_points
      FROM player_performance_data
      WHERE player_name = player_obj->>'name'
        AND match_date >= selection_record.week_start_date
        AND match_date <= selection_record.week_end_date
        AND season = '2025-2026';
      
      total_points := total_points + (substitute_points * 0.5);
    END LOOP;
  END IF;

  -- Update the calculated points in the selection
  UPDATE weekly_eleven_selections
  SET calculated_points = total_points
  WHERE id = selection_id;

  RETURN total_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;