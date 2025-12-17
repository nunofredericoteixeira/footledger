CREATE OR REPLACE FUNCTION update_user_player_points_from_performance()
RETURNS void AS $$
DECLARE
  user_record RECORD;
  player_record RECORD;
  total_pts numeric;
  last_week_pts numeric;
  last_week_start date;
  last_week_end date;
  target_season text := '2025-2026';
  normalized_name text;
BEGIN
  -- Semana anterior (terça a segunda)
  last_week_end := CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::integer - 1;
  IF EXTRACT(DOW FROM CURRENT_DATE) = 0 THEN
    last_week_end := CURRENT_DATE - 1;
  ELSIF EXTRACT(DOW FROM CURRENT_DATE) = 1 THEN
    last_week_end := CURRENT_DATE - 2;
  END IF;
  last_week_start := last_week_end - 6;

  -- Deteta a época disponível (aceita 2025-2026 ou 2025/2026)
  SELECT COALESCE((
    SELECT season
    FROM player_performance_data
    WHERE season IN ('2025-2026', '2025/2026')
    GROUP BY season
    ORDER BY COUNT(*) DESC, season DESC
    LIMIT 1
  ), target_season)
  INTO target_season;

  FOR user_record IN SELECT DISTINCT user_id FROM user_player_selections LOOP
    FOR player_record IN
      SELECT ups.player_id, pp.name AS player_name
      FROM user_player_selections ups
      JOIN player_pool pp ON pp.id = ups.player_id
      WHERE ups.user_id = user_record.user_id
    LOOP
      -- Normaliza nome e aplica aliases
      normalized_name := lower(unaccent(trim(regexp_replace(player_record.player_name, '\s+', ' ', 'g'))));
      IF normalized_name = 'zaidu' THEN
        normalized_name := 'zaidu sanusi';
      ELSIF normalized_name = 'leandro barreiro' THEN
        normalized_name := 'leandro barreiro martins';
      ELSIF normalized_name = 'ivan fresneda' THEN
        normalized_name := 'ivan fresneda';
      ELSIF normalized_name = 'nicolas otamendi' THEN
        normalized_name := 'nicolas otamendi';
      ELSIF normalized_name IN ('richard rios', 'richard ríos', 'richard ríos') THEN
        normalized_name := 'richard rios';
      ELSIF normalized_name = 'ruben dias' THEN
        normalized_name := 'ruben dias';
      ELSIF normalized_name = 'toni martinez' THEN
        normalized_name := 'toni martinez';
      ELSIF normalized_name IN ('isco', 'isco alarcon', 'isco alarcón') THEN
        normalized_name := 'isco alarcon';
      END IF;

      -- Pontos totais
      SELECT COALESCE(SUM(performance_score), 0)
      INTO total_pts
      FROM player_performance_data
      WHERE lower(unaccent(trim(regexp_replace(player_name, '\s+', ' ', 'g')))) = normalized_name
        AND season = target_season;

      -- Pontos da última semana
      SELECT COALESCE(SUM(performance_score), 0)
      INTO last_week_pts
      FROM player_performance_data
      WHERE lower(unaccent(trim(regexp_replace(player_name, '\s+', ' ', 'g')))) = normalized_name
        AND match_date >= last_week_start
        AND match_date <= last_week_end
        AND season = target_season;

      INSERT INTO user_player_total_points (
        user_id, player_id,
        total_points, last_week_points,
        useful_total_points, useful_week_points,
        updated_at
      ) VALUES (
        user_record.user_id,
        player_record.player_id,
        total_pts::integer,
        last_week_pts::integer,
        total_pts::integer,      -- útil total (placeholder)
        last_week_pts::integer,  -- útil semana (placeholder)
        now()
      )
      ON CONFLICT (user_id, player_id) DO UPDATE SET
        total_points = EXCLUDED.total_points,
        last_week_points = EXCLUDED.last_week_points,
        useful_total_points = EXCLUDED.useful_total_points,
        useful_week_points = EXCLUDED.useful_week_points,
        updated_at = now();
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_user_player_points_for_user(target_user_id uuid)
RETURNS void AS $$
DECLARE
  player_record RECORD;
  total_pts numeric;
  last_week_pts numeric;
  last_week_start date;
  last_week_end date;
  target_season text := '2025-2026';
  normalized_name text;
BEGIN
  last_week_end := CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::integer - 1;
  IF EXTRACT(DOW FROM CURRENT_DATE) = 0 THEN
    last_week_end := CURRENT_DATE - 1;
  ELSIF EXTRACT(DOW FROM CURRENT_DATE) = 1 THEN
    last_week_end := CURRENT_DATE - 2;
  END IF;
  last_week_start := last_week_end - 6;

  -- Deteta a época disponível (aceita 2025-2026 ou 2025/2026)
  SELECT COALESCE((
    SELECT season
    FROM player_performance_data
    WHERE season IN ('2025-2026', '2025/2026')
    GROUP BY season
    ORDER BY COUNT(*) DESC, season DESC
    LIMIT 1
  ), target_season)
  INTO target_season;

  FOR player_record IN
    SELECT ups.player_id, pp.name AS player_name
    FROM user_player_selections ups
    JOIN player_pool pp ON pp.id = ups.player_id
    WHERE ups.user_id = target_user_id
  LOOP
    normalized_name := lower(unaccent(trim(regexp_replace(player_record.player_name, '\s+', ' ', 'g'))));
    IF normalized_name = 'zaidu' THEN
      normalized_name := 'zaidu sanusi';
    ELSIF normalized_name = 'leandro barreiro' THEN
      normalized_name := 'leandro barreiro martins';
    ELSIF normalized_name = 'ivan fresneda' THEN
      normalized_name := 'ivan fresneda';
    ELSIF normalized_name = 'nicolas otamendi' THEN
      normalized_name := 'nicolas otamendi';
    ELSIF normalized_name IN ('richard rios', 'richard ríos', 'richard ríos') THEN
      normalized_name := 'richard rios';
    ELSIF normalized_name = 'ruben dias' THEN
      normalized_name := 'ruben dias';
    ELSIF normalized_name = 'toni martinez' THEN
      normalized_name := 'toni martinez';
    ELSIF normalized_name IN ('isco', 'isco alarcon', 'isco alarcón') THEN
      normalized_name := 'isco alarcon';
    END IF;

    SELECT COALESCE(SUM(performance_score), 0)
    INTO total_pts
    FROM player_performance_data
    WHERE lower(unaccent(trim(regexp_replace(player_name, '\s+', ' ', 'g')))) = normalized_name
      AND season = target_season;

    SELECT COALESCE(SUM(performance_score), 0)
    INTO last_week_pts
    FROM player_performance_data
    WHERE lower(unaccent(trim(regexp_replace(player_name, '\s+', ' ', 'g')))) = normalized_name
      AND match_date >= last_week_start
      AND match_date <= last_week_end
      AND season = target_season;

    INSERT INTO user_player_total_points (
      user_id, player_id,
      total_points, last_week_points,
      useful_total_points, useful_week_points,
      updated_at
    ) VALUES (
      target_user_id,
      player_record.player_id,
      total_pts::integer,
      last_week_pts::integer,
      total_pts::integer,
      last_week_pts::integer,
      now()
    )
    ON CONFLICT (user_id, player_id) DO UPDATE SET
      total_points = EXCLUDED.total_points,
      last_week_points = EXCLUDED.last_week_points,
      useful_total_points = EXCLUDED.useful_total_points,
      useful_week_points = EXCLUDED.useful_week_points,
      updated_at = now();
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
