


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."calculate_weekly_eleven_points"("selection_id" "uuid") RETURNS numeric
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."calculate_weekly_eleven_points"("selection_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_and_set_admin_status"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Check if the user's email is in admin_emails
  IF EXISTS (
    SELECT 1 FROM auth.users
    JOIN admin_emails ON auth.users.email = admin_emails.email
    WHERE auth.users.id = NEW.id
  ) THEN
    NEW.is_admin := true;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_and_set_admin_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_current_ratio_for_me"() RETURNS TABLE("user_id" "uuid", "budget" numeric, "pts_tu_sum" numeric, "current_ratio" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  return query
  select
    auth.uid() as user_id,
    up.remaining_budget as budget,
    upt_sum.pts_tu_sum,
    case when upt_sum.pts_tu_sum > 0
         then up.remaining_budget / upt_sum.pts_tu_sum
         else null end as current_ratio
  from user_profiles up
  left join (
    select user_id, sum(useful_total_points)::numeric as pts_tu_sum
    from user_player_total_points
    group by user_id
  ) upt_sum on upt_sum.user_id = auth.uid()
  where up.id = auth.uid();
end;
$$;


ALTER FUNCTION "public"."get_current_ratio_for_me"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_current_ratio_for_user"("p_user_id" "uuid") RETURNS TABLE("user_id" "uuid", "budget" numeric, "pts_tu_sum" numeric, "current_ratio" numeric)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select 
    up.id,
    up.remaining_budget,
    coalesce(sum(upt.useful_total_points), 0)::numeric as pts_tu_sum,
    case
      when coalesce(sum(upt.useful_total_points), 0) = 0 then null
      else up.remaining_budget / coalesce(sum(upt.useful_total_points), 0)::numeric
    end as current_ratio
  from user_profiles up
  left join user_player_total_points upt on upt.user_id = up.id
  where up.id = p_user_id
  group by up.id, up.remaining_budget;
$$;


ALTER FUNCTION "public"."get_current_ratio_for_user"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recalculate_all_weekly_points"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."recalculate_all_weekly_points"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_recalculate_points"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Recalculate points for all active weekly selections
  PERFORM recalculate_all_weekly_points();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_recalculate_points"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_player_points_for_user"("target_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  player_record RECORD;
  total_pts numeric;
  last_week_pts numeric;
  last_week_start date;
  last_week_end date;
  target_season text := '2025-2026';
  normalized_name text;
  selection_record RECORD;
  week_points numeric;
  useful_total_pts numeric;
  useful_week_pts numeric;
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
    ELSIF normalized_name IN ('richard rios', 'richard ríos', 'richard ríos') THEN
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

    useful_total_pts := 0;
    useful_week_pts := 0;

    FOR selection_record IN
      SELECT
        wes.week_start_date,
        wes.week_end_date,
        CASE
          WHEN EXISTS (
            SELECT 1 FROM jsonb_array_elements(wes.starting_eleven) elem
            WHERE elem->>'id' = player_record.player_id::text
          ) THEN 1::numeric
          WHEN EXISTS (
            SELECT 1 FROM jsonb_array_elements(wes.substitutes) elem
            WHERE elem->>'id' = player_record.player_id::text
          ) THEN 0.5::numeric
          ELSE 0::numeric
        END AS weight
      FROM weekly_eleven_selections wes
      WHERE wes.user_id = target_user_id
    LOOP
      IF selection_record.weight <= 0 THEN
        CONTINUE;
      END IF;

      SELECT COALESCE(SUM(performance_score), 0)
      INTO week_points
      FROM player_performance_data
      WHERE lower(unaccent(trim(regexp_replace(player_name, '\s+', ' ', 'g')))) = normalized_name
        AND season = target_season
        AND match_date >= selection_record.week_start_date
        AND match_date <= selection_record.week_end_date;

      useful_total_pts := useful_total_pts + (week_points * selection_record.weight);

      IF CURRENT_DATE BETWEEN selection_record.week_start_date AND selection_record.week_end_date THEN
        useful_week_pts := week_points * selection_record.weight;
      END IF;
    END LOOP;

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
      ROUND(COALESCE(useful_total_pts, 0))::integer,
      ROUND(COALESCE(useful_week_pts, 0))::integer,
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
$$;


ALTER FUNCTION "public"."update_user_player_points_for_user"("target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_player_points_from_performance"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_record RECORD;
  player_record RECORD;
  total_pts numeric;
  last_week_pts numeric;
  last_week_start date;
  last_week_end date;
  target_season text := '2025-2026';
  normalized_name text;
  selection_record RECORD;
  week_points numeric;
  useful_total_pts numeric;
  useful_week_pts numeric;
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
      ELSIF normalized_name IN ('richard rios', 'richard ríos', 'richard ríos') THEN
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

      useful_total_pts := 0;
      useful_week_pts := 0;

      FOR selection_record IN
        SELECT
          wes.week_start_date,
          wes.week_end_date,
          CASE
            WHEN EXISTS (
              SELECT 1 FROM jsonb_array_elements(wes.starting_eleven) elem
              WHERE elem->>'id' = player_record.player_id::text
            ) THEN 1::numeric
            WHEN EXISTS (
              SELECT 1 FROM jsonb_array_elements(wes.substitutes) elem
              WHERE elem->>'id' = player_record.player_id::text
            ) THEN 0.5::numeric
            ELSE 0::numeric
          END AS weight
        FROM weekly_eleven_selections wes
        WHERE wes.user_id = user_record.user_id
      LOOP
        IF selection_record.weight <= 0 THEN
          CONTINUE;
        END IF;

        SELECT COALESCE(SUM(performance_score), 0)
        INTO week_points
        FROM player_performance_data
        WHERE lower(unaccent(trim(regexp_replace(player_name, '\s+', ' ', 'g')))) = normalized_name
          AND season = target_season
          AND match_date >= selection_record.week_start_date
          AND match_date <= selection_record.week_end_date;

        useful_total_pts := useful_total_pts + (week_points * selection_record.weight);

        IF CURRENT_DATE BETWEEN selection_record.week_start_date AND selection_record.week_end_date THEN
          useful_week_pts := week_points * selection_record.weight;
        END IF;
      END LOOP;

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
        ROUND(COALESCE(useful_total_pts, 0))::integer,
        ROUND(COALESCE(useful_week_pts, 0))::integer,
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
$$;


ALTER FUNCTION "public"."update_user_player_points_from_performance"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_emails" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."admin_emails" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text",
    "name" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."app_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."auction_bids" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "auction_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "bid_amount" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."auction_bids" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."auction_players" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "position" "text" NOT NULL,
    "club" "text" NOT NULL,
    "league" "text" NOT NULL,
    "value" numeric DEFAULT 0 NOT NULL,
    "image_url" "text",
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."auction_players" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."auctions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "auction_player_id" "uuid" NOT NULL,
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone NOT NULL,
    "starting_bid" numeric DEFAULT 0 NOT NULL,
    "current_bid" numeric DEFAULT 0,
    "winner_user_id" "uuid",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."auctions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."league_invitations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "league_id" "uuid",
    "invited_by" "uuid",
    "invited_user_email" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone DEFAULT ("now"() + '14 days'::interval)
);


ALTER TABLE "public"."league_invitations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."league_members" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "league_id" "uuid",
    "user_id" "uuid" NOT NULL,
    "payment_verified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."league_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leagues" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "entry_fee" numeric DEFAULT 0,
    "max_members" integer DEFAULT 20,
    "owner_nft_verified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."leagues" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."matches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "home_team_id" "uuid" NOT NULL,
    "away_team_id" "uuid" NOT NULL,
    "home_score" integer DEFAULT 0,
    "away_score" integer DEFAULT 0,
    "match_date" timestamp with time zone NOT NULL,
    "location" "text",
    "status" "text" DEFAULT 'scheduled'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "different_teams" CHECK (("home_team_id" <> "away_team_id"))
);


ALTER TABLE "public"."matches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."player_name_aliases" (
    "player_id" "uuid" NOT NULL,
    "perf_name" "text" NOT NULL
);


ALTER TABLE "public"."player_name_aliases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."player_performance_data" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "player_name" "text" NOT NULL,
    "match_date" "date" NOT NULL,
    "performance_score" numeric(10,2) DEFAULT 0 NOT NULL,
    "season" "text" DEFAULT '2025-2026'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."player_performance_data" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."player_pool" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "league" "text" NOT NULL,
    "club" "text" NOT NULL,
    "position" "text" NOT NULL,
    "value" numeric DEFAULT 0 NOT NULL,
    "url" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."player_pool" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."player_stats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "match_id" "uuid" NOT NULL,
    "player_id" "uuid" NOT NULL,
    "goals" integer DEFAULT 0,
    "assists" integer DEFAULT 0,
    "yellow_cards" integer DEFAULT 0,
    "red_cards" integer DEFAULT 0,
    "minutes_played" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."player_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."player_weekly_points" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "player_id" "uuid" NOT NULL,
    "week_start_date" "date" NOT NULL,
    "points" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."player_weekly_points" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."weekly_eleven_selections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "week_start_date" "date" NOT NULL,
    "week_end_date" "date" NOT NULL,
    "starting_eleven" "jsonb" NOT NULL,
    "substitutes" "jsonb" NOT NULL,
    "tactic_name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "calculated_points" numeric(10,2) DEFAULT 0
);


ALTER TABLE "public"."weekly_eleven_selections" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."player_useful_points" AS
 SELECT "pw"."player_id",
    "ws"."user_id",
    "ws"."week_start_date",
    "ws"."week_end_date",
    "sum"("pw"."points") AS "points_useful"
   FROM ("public"."player_weekly_points" "pw"
     JOIN "public"."weekly_eleven_selections" "ws" ON (((("pw"."week_start_date" >= "ws"."week_start_date") AND ("pw"."week_start_date" <= "ws"."week_end_date")) AND (("pw"."player_id" = ANY (COALESCE(( SELECT "array_agg"((("p"."value" ->> 'id'::"text"))::"uuid") AS "array_agg"
           FROM "jsonb_array_elements"("ws"."starting_eleven") "p"("value")), ARRAY[]::"uuid"[]))) OR ("pw"."player_id" = ANY (COALESCE(( SELECT "array_agg"((("p"."value" ->> 'id'::"text"))::"uuid") AS "array_agg"
           FROM "jsonb_array_elements"("ws"."substitutes") "p"("value")), ARRAY[]::"uuid"[])))))))
  GROUP BY "pw"."player_id", "ws"."user_id", "ws"."week_start_date", "ws"."week_end_date";


ALTER VIEW "public"."player_useful_points" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."players" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "team_id" "uuid",
    "name" "text" NOT NULL,
    "position" "text" NOT NULL,
    "jersey_number" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."players" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tactic_positions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tactic_id" "uuid",
    "slot_index" integer NOT NULL,
    "label" "text" NOT NULL,
    "x_percent" numeric NOT NULL,
    "y_percent" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tactic_positions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tactics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "position_requirements" "jsonb",
    "position_groups" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tactics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teams" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "logo_url" "text",
    "founded_year" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "team_value" numeric(15,2) DEFAULT 0,
    "league" "text"
);


ALTER TABLE "public"."teams" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_auction_wins" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "auction_id" "uuid" NOT NULL,
    "auction_player_id" "uuid" NOT NULL,
    "won_at" timestamp with time zone DEFAULT "now"(),
    "used_in_week" "date",
    "is_used" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_auction_wins" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_nfts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "token_id" "text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_nfts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_player_selections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "player_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_player_selections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_player_total_points" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "player_id" "uuid" NOT NULL,
    "total_points" integer DEFAULT 0 NOT NULL,
    "last_week_points" integer DEFAULT 0 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "useful_total_points" integer DEFAULT 0 NOT NULL,
    "useful_week_points" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."user_player_total_points" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" NOT NULL,
    "selected_team_id" "uuid",
    "team_value" numeric(15,2) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_admin" boolean DEFAULT false,
    "remaining_budget" numeric DEFAULT 0,
    "players_locked" boolean DEFAULT false,
    "position_requirements" "jsonb",
    "total_points" integer DEFAULT 0 NOT NULL,
    "dragon_nft_address" "text",
    "dragon_nft_number" "text",
    "footlegers_token_verified" boolean DEFAULT false,
    "nft_verified_at" timestamp with time zone,
    "dragon_nft_name" "text",
    "dragon_nft_owner_address" "text",
    "footledgers" integer DEFAULT 0,
    "nft_verified" boolean DEFAULT false,
    "language" "text" DEFAULT 'pt'::"text",
    "position_groups" "jsonb",
    "username" "text",
    CONSTRAINT "user_profiles_language_check" CHECK (("language" = ANY (ARRAY['pt'::"text", 'es'::"text", 'fr'::"text", 'it'::"text", 'en'::"text", 'de'::"text"])))
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_tactic_selection" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tactic_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_tactic_selection" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_tactic_selection" IS 'Stores user tactic selections. Users can update their selection by deleting old records and inserting new ones.';



CREATE TABLE IF NOT EXISTS "public"."user_weekly_choices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "week_start" "date" NOT NULL,
    "week_end" "date" NOT NULL,
    "starting_eleven" "jsonb" NOT NULL,
    "substitutes" "jsonb" NOT NULL,
    "tactic_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_weekly_choices" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admin_emails"
    ADD CONSTRAINT "admin_emails_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."admin_emails"
    ADD CONSTRAINT "admin_emails_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_users"
    ADD CONSTRAINT "app_users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."app_users"
    ADD CONSTRAINT "app_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."auction_bids"
    ADD CONSTRAINT "auction_bids_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."auction_players"
    ADD CONSTRAINT "auction_players_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."auctions"
    ADD CONSTRAINT "auctions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."league_invitations"
    ADD CONSTRAINT "league_invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."league_members"
    ADD CONSTRAINT "league_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leagues"
    ADD CONSTRAINT "leagues_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."player_name_aliases"
    ADD CONSTRAINT "player_name_aliases_pkey" PRIMARY KEY ("player_id", "perf_name");



ALTER TABLE ONLY "public"."player_performance_data"
    ADD CONSTRAINT "player_performance_data_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."player_performance_data"
    ADD CONSTRAINT "player_performance_data_player_name_match_date_season_key" UNIQUE ("player_name", "match_date", "season");



ALTER TABLE ONLY "public"."player_pool"
    ADD CONSTRAINT "player_pool_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."player_stats"
    ADD CONSTRAINT "player_stats_match_id_player_id_key" UNIQUE ("match_id", "player_id");



ALTER TABLE ONLY "public"."player_stats"
    ADD CONSTRAINT "player_stats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."player_weekly_points"
    ADD CONSTRAINT "player_weekly_points_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."player_weekly_points"
    ADD CONSTRAINT "player_weekly_points_player_id_week_start_date_key" UNIQUE ("player_id", "week_start_date");



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tactic_positions"
    ADD CONSTRAINT "tactic_positions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tactic_positions"
    ADD CONSTRAINT "tactic_positions_tactic_id_slot_index_key" UNIQUE ("tactic_id", "slot_index");



ALTER TABLE ONLY "public"."tactics"
    ADD CONSTRAINT "tactics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_auction_wins"
    ADD CONSTRAINT "user_auction_wins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_nfts"
    ADD CONSTRAINT "user_nfts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_player_selections"
    ADD CONSTRAINT "user_player_selections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_player_selections"
    ADD CONSTRAINT "user_player_selections_user_id_player_id_key" UNIQUE ("user_id", "player_id");



ALTER TABLE ONLY "public"."user_player_total_points"
    ADD CONSTRAINT "user_player_total_points_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_player_total_points"
    ADD CONSTRAINT "user_player_total_points_user_id_player_id_key" UNIQUE ("user_id", "player_id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_tactic_selection"
    ADD CONSTRAINT "user_tactic_selection_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_weekly_choices"
    ADD CONSTRAINT "user_weekly_choices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_weekly_choices"
    ADD CONSTRAINT "user_weekly_choices_user_id_week_start_key" UNIQUE ("user_id", "week_start");



ALTER TABLE ONLY "public"."weekly_eleven_selections"
    ADD CONSTRAINT "weekly_eleven_selections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."weekly_eleven_selections"
    ADD CONSTRAINT "weekly_eleven_selections_user_id_week_start_date_key" UNIQUE ("user_id", "week_start_date");



CREATE INDEX "idx_auction_bids_auction_id" ON "public"."auction_bids" USING "btree" ("auction_id");



CREATE INDEX "idx_auction_bids_user_id" ON "public"."auction_bids" USING "btree" ("user_id");



CREATE INDEX "idx_auctions_end_date" ON "public"."auctions" USING "btree" ("end_date");



CREATE INDEX "idx_auctions_status" ON "public"."auctions" USING "btree" ("status");



CREATE INDEX "idx_matches_away_team" ON "public"."matches" USING "btree" ("away_team_id");



CREATE INDEX "idx_matches_date" ON "public"."matches" USING "btree" ("match_date" DESC);



CREATE INDEX "idx_matches_home_team" ON "public"."matches" USING "btree" ("home_team_id");



CREATE INDEX "idx_player_performance_date" ON "public"."player_performance_data" USING "btree" ("match_date");



CREATE INDEX "idx_player_performance_name" ON "public"."player_performance_data" USING "btree" ("player_name");



CREATE INDEX "idx_player_performance_season" ON "public"."player_performance_data" USING "btree" ("season");



CREATE INDEX "idx_player_pool_club" ON "public"."player_pool" USING "btree" ("club");



CREATE INDEX "idx_player_pool_league" ON "public"."player_pool" USING "btree" ("league");



CREATE INDEX "idx_player_pool_name" ON "public"."player_pool" USING "btree" ("name");



CREATE INDEX "idx_player_pool_position" ON "public"."player_pool" USING "btree" ("position");



CREATE INDEX "idx_player_pool_value" ON "public"."player_pool" USING "btree" ("value" DESC);



CREATE INDEX "idx_player_stats_match" ON "public"."player_stats" USING "btree" ("match_id");



CREATE INDEX "idx_player_stats_player" ON "public"."player_stats" USING "btree" ("player_id");



CREATE INDEX "idx_player_weekly_points_player_week" ON "public"."player_weekly_points" USING "btree" ("player_id", "week_start_date");



CREATE INDEX "idx_players_team_id" ON "public"."players" USING "btree" ("team_id");



CREATE INDEX "idx_user_auction_wins_is_used" ON "public"."user_auction_wins" USING "btree" ("is_used");



CREATE INDEX "idx_user_auction_wins_user_id" ON "public"."user_auction_wins" USING "btree" ("user_id");



CREATE INDEX "idx_user_player_selections_player" ON "public"."user_player_selections" USING "btree" ("player_id");



CREATE INDEX "idx_user_player_selections_user" ON "public"."user_player_selections" USING "btree" ("user_id");



CREATE INDEX "idx_user_player_total_points_player" ON "public"."user_player_total_points" USING "btree" ("player_id");



CREATE INDEX "idx_user_player_total_points_user" ON "public"."user_player_total_points" USING "btree" ("user_id");



CREATE INDEX "idx_weekly_eleven_user_week" ON "public"."weekly_eleven_selections" USING "btree" ("user_id", "week_start_date");



CREATE OR REPLACE TRIGGER "on_performance_data_change" AFTER INSERT OR DELETE OR UPDATE ON "public"."player_performance_data" FOR EACH STATEMENT EXECUTE FUNCTION "public"."trigger_recalculate_points"();



CREATE OR REPLACE TRIGGER "set_admin_status_on_profile_creation" BEFORE INSERT ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."check_and_set_admin_status"();



CREATE OR REPLACE TRIGGER "update_player_performance_updated_at" BEFORE UPDATE ON "public"."player_performance_data" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_profiles_updated_at" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."auction_bids"
    ADD CONSTRAINT "auction_bids_auction_id_fkey" FOREIGN KEY ("auction_id") REFERENCES "public"."auctions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."auction_bids"
    ADD CONSTRAINT "auction_bids_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."auctions"
    ADD CONSTRAINT "auctions_auction_player_id_fkey" FOREIGN KEY ("auction_player_id") REFERENCES "public"."auction_players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."auctions"
    ADD CONSTRAINT "auctions_winner_user_id_fkey" FOREIGN KEY ("winner_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."league_invitations"
    ADD CONSTRAINT "league_invitations_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."league_members"
    ADD CONSTRAINT "league_members_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_away_team_id_fkey" FOREIGN KEY ("away_team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_home_team_id_fkey" FOREIGN KEY ("home_team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_name_aliases"
    ADD CONSTRAINT "player_name_aliases_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."player_pool"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_stats"
    ADD CONSTRAINT "player_stats_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_stats"
    ADD CONSTRAINT "player_stats_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_weekly_points"
    ADD CONSTRAINT "player_weekly_points_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."player_pool"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tactic_positions"
    ADD CONSTRAINT "tactic_positions_tactic_id_fkey" FOREIGN KEY ("tactic_id") REFERENCES "public"."tactics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_auction_wins"
    ADD CONSTRAINT "user_auction_wins_auction_id_fkey" FOREIGN KEY ("auction_id") REFERENCES "public"."auctions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_auction_wins"
    ADD CONSTRAINT "user_auction_wins_auction_player_id_fkey" FOREIGN KEY ("auction_player_id") REFERENCES "public"."auction_players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_auction_wins"
    ADD CONSTRAINT "user_auction_wins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_nfts"
    ADD CONSTRAINT "user_nfts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_player_selections"
    ADD CONSTRAINT "user_player_selections_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."player_pool"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_player_selections"
    ADD CONSTRAINT "user_player_selections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_player_total_points"
    ADD CONSTRAINT "user_player_total_points_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."player_pool"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_player_total_points"
    ADD CONSTRAINT "user_player_total_points_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_selected_team_id_fkey" FOREIGN KEY ("selected_team_id") REFERENCES "public"."teams"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_tactic_selection"
    ADD CONSTRAINT "user_tactic_selection_tactic_id_fkey" FOREIGN KEY ("tactic_id") REFERENCES "public"."tactics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_tactic_selection"
    ADD CONSTRAINT "user_tactic_selection_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_weekly_choices"
    ADD CONSTRAINT "user_weekly_choices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."weekly_eleven_selections"
    ADD CONSTRAINT "weekly_eleven_selections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can delete performance data" ON "public"."player_performance_data" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))));



CREATE POLICY "Admins can insert performance data" ON "public"."player_performance_data" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))));



CREATE POLICY "Admins can insert weekly points" ON "public"."player_weekly_points" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))));



CREATE POLICY "Admins can update performance data" ON "public"."player_performance_data" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))));



CREATE POLICY "Admins can update weekly points" ON "public"."player_weekly_points" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))));



CREATE POLICY "Anyone can view auction players" ON "public"."auction_players" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Anyone can view auctions" ON "public"."auctions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Anyone can view matches" ON "public"."matches" FOR SELECT USING (true);



CREATE POLICY "Anyone can view player pool" ON "public"."player_pool" FOR SELECT USING (true);



CREATE POLICY "Anyone can view player stats" ON "public"."player_stats" FOR SELECT USING (true);



CREATE POLICY "Anyone can view player_performance_data" ON "public"."player_performance_data" FOR SELECT USING (true);



CREATE POLICY "Anyone can view players" ON "public"."players" FOR SELECT USING (true);



CREATE POLICY "Anyone can view tactics" ON "public"."tactics" FOR SELECT USING (true);



CREATE POLICY "Anyone can view teams" ON "public"."teams" FOR SELECT USING (true);



CREATE POLICY "Anyone can view weekly points" ON "public"."player_weekly_points" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can delete matches" ON "public"."matches" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can delete player stats" ON "public"."player_stats" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can delete players" ON "public"."players" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can delete teams" ON "public"."teams" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can insert matches" ON "public"."matches" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can insert player stats" ON "public"."player_stats" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can insert players" ON "public"."players" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can insert teams" ON "public"."teams" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can manage tactics" ON "public"."tactics" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can update matches" ON "public"."matches" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can update player stats" ON "public"."player_stats" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can update players" ON "public"."players" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can update teams" ON "public"."teams" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can view performance data" ON "public"."player_performance_data" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view player pool" ON "public"."player_pool" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Only admins can delete auction players" ON "public"."auction_players" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))));



CREATE POLICY "Only admins can delete auctions" ON "public"."auctions" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))));



CREATE POLICY "Only admins can insert auction players" ON "public"."auction_players" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))));



CREATE POLICY "Only admins can insert auction wins" ON "public"."user_auction_wins" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))));



CREATE POLICY "Only admins can insert auctions" ON "public"."auctions" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))));



CREATE POLICY "Only admins can update auction players" ON "public"."auction_players" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))));



CREATE POLICY "Only admins can update auctions" ON "public"."auctions" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))));



CREATE POLICY "Only admins can view admin emails" ON "public"."admin_emails" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))));



CREATE POLICY "Service role can delete performance data" ON "public"."player_performance_data" FOR DELETE TO "service_role" USING (true);



CREATE POLICY "Service role can insert performance data" ON "public"."player_performance_data" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "Service role can update performance data" ON "public"."player_performance_data" FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can view performance data" ON "public"."player_performance_data" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "Users can delete own player selections" ON "public"."user_player_selections" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own weekly selections" ON "public"."weekly_eleven_selections" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own player points" ON "public"."user_player_total_points" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own player selections" ON "public"."user_player_selections" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."user_profiles" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert own weekly selections" ON "public"."weekly_eleven_selections" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their tactic selection" ON "public"."user_tactic_selection" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can place their own bids" ON "public"."auction_bids" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own NFT information" ON "public"."user_profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own player points" ON "public"."user_player_total_points" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."user_profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own weekly selections" ON "public"."weekly_eleven_selections" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own wins usage status" ON "public"."user_auction_wins" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view all bids" ON "public"."auction_bids" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can view own player points" ON "public"."user_player_total_points" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own player selections" ON "public"."user_player_selections" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."user_profiles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own weekly selections" ON "public"."weekly_eleven_selections" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own wins" ON "public"."user_auction_wins" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their tactic selection" ON "public"."user_tactic_selection" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."admin_emails" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."auction_bids" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."auction_players" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."auctions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "insert own profile" ON "public"."user_profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



ALTER TABLE "public"."matches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."player_performance_data" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."player_pool" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."player_stats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."player_weekly_points" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."players" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public read totals" ON "public"."user_player_total_points" FOR SELECT USING (true);



CREATE POLICY "select own profile" ON "public"."user_profiles" FOR SELECT USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."tactics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."teams" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "update own profile" ON "public"."user_profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."user_auction_wins" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_player_selections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_player_total_points" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_tactic_selection" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users can read own totals" ON "public"."user_player_total_points" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."weekly_eleven_selections" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_weekly_eleven_points"("selection_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_weekly_eleven_points"("selection_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_weekly_eleven_points"("selection_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_and_set_admin_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_and_set_admin_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_and_set_admin_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_ratio_for_me"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_ratio_for_me"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_ratio_for_me"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_ratio_for_user"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_ratio_for_user"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_ratio_for_user"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."recalculate_all_weekly_points"() TO "anon";
GRANT ALL ON FUNCTION "public"."recalculate_all_weekly_points"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."recalculate_all_weekly_points"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_recalculate_points"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_recalculate_points"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_recalculate_points"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_player_points_for_user"("target_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_player_points_for_user"("target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_player_points_for_user"("target_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_player_points_from_performance"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_player_points_from_performance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_player_points_from_performance"() TO "service_role";



GRANT ALL ON TABLE "public"."admin_emails" TO "anon";
GRANT ALL ON TABLE "public"."admin_emails" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_emails" TO "service_role";



GRANT ALL ON TABLE "public"."app_users" TO "anon";
GRANT ALL ON TABLE "public"."app_users" TO "authenticated";
GRANT ALL ON TABLE "public"."app_users" TO "service_role";



GRANT ALL ON TABLE "public"."auction_bids" TO "anon";
GRANT ALL ON TABLE "public"."auction_bids" TO "authenticated";
GRANT ALL ON TABLE "public"."auction_bids" TO "service_role";



GRANT ALL ON TABLE "public"."auction_players" TO "anon";
GRANT ALL ON TABLE "public"."auction_players" TO "authenticated";
GRANT ALL ON TABLE "public"."auction_players" TO "service_role";



GRANT ALL ON TABLE "public"."auctions" TO "anon";
GRANT ALL ON TABLE "public"."auctions" TO "authenticated";
GRANT ALL ON TABLE "public"."auctions" TO "service_role";



GRANT ALL ON TABLE "public"."league_invitations" TO "anon";
GRANT ALL ON TABLE "public"."league_invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."league_invitations" TO "service_role";



GRANT ALL ON TABLE "public"."league_members" TO "anon";
GRANT ALL ON TABLE "public"."league_members" TO "authenticated";
GRANT ALL ON TABLE "public"."league_members" TO "service_role";



GRANT ALL ON TABLE "public"."leagues" TO "anon";
GRANT ALL ON TABLE "public"."leagues" TO "authenticated";
GRANT ALL ON TABLE "public"."leagues" TO "service_role";



GRANT ALL ON TABLE "public"."matches" TO "anon";
GRANT ALL ON TABLE "public"."matches" TO "authenticated";
GRANT ALL ON TABLE "public"."matches" TO "service_role";



GRANT ALL ON TABLE "public"."player_name_aliases" TO "anon";
GRANT ALL ON TABLE "public"."player_name_aliases" TO "authenticated";
GRANT ALL ON TABLE "public"."player_name_aliases" TO "service_role";



GRANT ALL ON TABLE "public"."player_performance_data" TO "anon";
GRANT ALL ON TABLE "public"."player_performance_data" TO "authenticated";
GRANT ALL ON TABLE "public"."player_performance_data" TO "service_role";



GRANT ALL ON TABLE "public"."player_pool" TO "anon";
GRANT ALL ON TABLE "public"."player_pool" TO "authenticated";
GRANT ALL ON TABLE "public"."player_pool" TO "service_role";



GRANT ALL ON TABLE "public"."player_stats" TO "anon";
GRANT ALL ON TABLE "public"."player_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."player_stats" TO "service_role";



GRANT ALL ON TABLE "public"."player_weekly_points" TO "anon";
GRANT ALL ON TABLE "public"."player_weekly_points" TO "authenticated";
GRANT ALL ON TABLE "public"."player_weekly_points" TO "service_role";



GRANT ALL ON TABLE "public"."weekly_eleven_selections" TO "anon";
GRANT ALL ON TABLE "public"."weekly_eleven_selections" TO "authenticated";
GRANT ALL ON TABLE "public"."weekly_eleven_selections" TO "service_role";



GRANT ALL ON TABLE "public"."player_useful_points" TO "anon";
GRANT ALL ON TABLE "public"."player_useful_points" TO "authenticated";
GRANT ALL ON TABLE "public"."player_useful_points" TO "service_role";



GRANT ALL ON TABLE "public"."players" TO "anon";
GRANT ALL ON TABLE "public"."players" TO "authenticated";
GRANT ALL ON TABLE "public"."players" TO "service_role";



GRANT ALL ON TABLE "public"."tactic_positions" TO "anon";
GRANT ALL ON TABLE "public"."tactic_positions" TO "authenticated";
GRANT ALL ON TABLE "public"."tactic_positions" TO "service_role";



GRANT ALL ON TABLE "public"."tactics" TO "anon";
GRANT ALL ON TABLE "public"."tactics" TO "authenticated";
GRANT ALL ON TABLE "public"."tactics" TO "service_role";



GRANT ALL ON TABLE "public"."teams" TO "anon";
GRANT ALL ON TABLE "public"."teams" TO "authenticated";
GRANT ALL ON TABLE "public"."teams" TO "service_role";



GRANT ALL ON TABLE "public"."user_auction_wins" TO "anon";
GRANT ALL ON TABLE "public"."user_auction_wins" TO "authenticated";
GRANT ALL ON TABLE "public"."user_auction_wins" TO "service_role";



GRANT ALL ON TABLE "public"."user_nfts" TO "anon";
GRANT ALL ON TABLE "public"."user_nfts" TO "authenticated";
GRANT ALL ON TABLE "public"."user_nfts" TO "service_role";



GRANT ALL ON TABLE "public"."user_player_selections" TO "anon";
GRANT ALL ON TABLE "public"."user_player_selections" TO "authenticated";
GRANT ALL ON TABLE "public"."user_player_selections" TO "service_role";



GRANT ALL ON TABLE "public"."user_player_total_points" TO "anon";
GRANT ALL ON TABLE "public"."user_player_total_points" TO "authenticated";
GRANT ALL ON TABLE "public"."user_player_total_points" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."user_tactic_selection" TO "anon";
GRANT ALL ON TABLE "public"."user_tactic_selection" TO "authenticated";
GRANT ALL ON TABLE "public"."user_tactic_selection" TO "service_role";



GRANT ALL ON TABLE "public"."user_weekly_choices" TO "anon";
GRANT ALL ON TABLE "public"."user_weekly_choices" TO "authenticated";
GRANT ALL ON TABLE "public"."user_weekly_choices" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







