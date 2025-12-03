/*
  # Add Function to Update User Player Total Points
  
  1. Function Purpose
    - Aggregates performance data from player_performance_data
    - Updates user_player_total_points with total and last week points
    - Can be called after importing new performance data
  
  2. How it works
    - For each user's selected players, calculates:
      - Total points: sum of all performance scores
      - Last week points: sum of scores from last completed week
    - Updates or inserts into user_player_total_points
*/

-- Function to update user player points from performance data
CREATE OR REPLACE FUNCTION update_user_player_points_from_performance()
RETURNS void AS $$
DECLARE
  user_record RECORD;
  player_record RECORD;
  total_pts numeric;
  last_week_pts numeric;
  last_week_start date;
  last_week_end date;
BEGIN
  -- Calculate last week dates (previous Tuesday to Monday)
  last_week_end := CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::integer - 1;
  IF EXTRACT(DOW FROM CURRENT_DATE) = 0 THEN
    last_week_end := CURRENT_DATE - 1;
  ELSIF EXTRACT(DOW FROM CURRENT_DATE) = 1 THEN
    last_week_end := CURRENT_DATE - 2;
  END IF;
  
  last_week_start := last_week_end - 6;
  
  -- Loop through all users
  FOR user_record IN
    SELECT DISTINCT user_id FROM user_player_selections
  LOOP
    -- Loop through each player selected by this user
    FOR player_record IN
      SELECT ups.player_id, pp.name as player_name
      FROM user_player_selections ups
      JOIN player_pool pp ON pp.id = ups.player_id
      WHERE ups.user_id = user_record.user_id
    LOOP
      -- Calculate total points
      SELECT COALESCE(SUM(performance_score), 0)
      INTO total_pts
      FROM player_performance_data
      WHERE player_name = player_record.player_name
        AND season = '2025-2026';
      
      -- Calculate last week points
      SELECT COALESCE(SUM(performance_score), 0)
      INTO last_week_pts
      FROM player_performance_data
      WHERE player_name = player_record.player_name
        AND match_date >= last_week_start
        AND match_date <= last_week_end
        AND season = '2025-2026';
      
      -- Upsert into user_player_total_points
      INSERT INTO user_player_total_points (
        user_id,
        player_id,
        total_points,
        last_week_points,
        updated_at
      ) VALUES (
        user_record.user_id,
        player_record.player_id,
        total_pts::integer,
        last_week_pts::integer,
        now()
      )
      ON CONFLICT (user_id, player_id)
      DO UPDATE SET
        total_points = EXCLUDED.total_points,
        last_week_points = EXCLUDED.last_week_points,
        updated_at = now();
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update points for a specific user (useful for real-time updates)
CREATE OR REPLACE FUNCTION update_user_player_points_for_user(target_user_id uuid)
RETURNS void AS $$
DECLARE
  player_record RECORD;
  total_pts numeric;
  last_week_pts numeric;
  last_week_start date;
  last_week_end date;
BEGIN
  -- Calculate last week dates
  last_week_end := CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::integer - 1;
  IF EXTRACT(DOW FROM CURRENT_DATE) = 0 THEN
    last_week_end := CURRENT_DATE - 1;
  ELSIF EXTRACT(DOW FROM CURRENT_DATE) = 1 THEN
    last_week_end := CURRENT_DATE - 2;
  END IF;
  
  last_week_start := last_week_end - 6;
  
  -- Loop through each player selected by this user
  FOR player_record IN
    SELECT ups.player_id, pp.name as player_name
    FROM user_player_selections ups
    JOIN player_pool pp ON pp.id = ups.player_id
    WHERE ups.user_id = target_user_id
  LOOP
    -- Calculate total points
    SELECT COALESCE(SUM(performance_score), 0)
    INTO total_pts
    FROM player_performance_data
    WHERE player_name = player_record.player_name
      AND season = '2025-2026';
    
    -- Calculate last week points
    SELECT COALESCE(SUM(performance_score), 0)
    INTO last_week_pts
    FROM player_performance_data
    WHERE player_name = player_record.player_name
      AND match_date >= last_week_start
      AND match_date <= last_week_end
      AND season = '2025-2026';
    
    -- Upsert into user_player_total_points
    INSERT INTO user_player_total_points (
      user_id,
      player_id,
      total_points,
      last_week_points,
      updated_at
    ) VALUES (
      target_user_id,
      player_record.player_id,
      total_pts::integer,
      last_week_pts::integer,
      now()
    )
    ON CONFLICT (user_id, player_id)
    DO UPDATE SET
      total_points = EXCLUDED.total_points,
      last_week_points = EXCLUDED.last_week_points,
      updated_at = now();
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
