-- Helper to normalize player names once (lowercase, trim spaces, remove accents)
create or replace function public.normalize_player_name(input_name text)
returns text
language sql
immutable
as $$
  select case
    when input_name is null then null
    else lower(public.unaccent(trim(regexp_replace(input_name, '\s+', ' ', 'g'))))
  end;
$$;

----------------------------------------------------------------------
-- Update per-user recalculation to rely on normalized names + aliases
create or replace function public.update_user_player_points_for_user(target_user_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  player_record record;
  total_pts numeric;
  last_week_pts numeric;
  last_week_start date;
  last_week_end date;
  target_season text := '2025-2026';
  match_names text[];
  alias_names text[];
  selection_record record;
  week_points numeric;
  useful_total_pts numeric;
  useful_week_pts numeric;
begin
  -- Semana anterior (terça a segunda)
  last_week_end := current_date - extract(dow from current_date)::integer - 1;
  if extract(dow from current_date) = 0 then
    last_week_end := current_date - 1;
  elsif extract(dow from current_date) = 1 then
    last_week_end := current_date - 2;
  end if;
  last_week_start := last_week_end - 6;

  -- Temporada alvo (considera 2025-2026 ou 2025/2026 consoante dados disponíveis)
  select coalesce((
    select season
    from player_performance_data
    where season in ('2025-2026', '2025/2026')
    group by season
    order by count(*) desc, season desc
    limit 1
  ), target_season)
  into target_season;

  for player_record in
    select ups.player_id, pp.name as player_name
    from user_player_selections ups
    join player_pool pp on pp.id = ups.player_id
    where ups.user_id = target_user_id
  loop
    -- Constrói lista de nomes equivalentes (nome base + aliases configurados)
    match_names := array[public.normalize_player_name(player_record.player_name)];

    select coalesce(array_agg(public.normalize_player_name(perf_name)), array[]::text[])
    into alias_names
    from player_name_aliases
    where player_id = player_record.player_id;

    if alias_names is not null and array_length(alias_names, 1) > 0 then
      match_names := match_names || alias_names;
    end if;

    match_names := coalesce((
      select array(
        select distinct name
        from unnest(match_names) as name
        where name is not null
      )
    ), array[]::text[]);

    if array_length(match_names, 1) is null then
      match_names := array[public.normalize_player_name(player_record.player_name)];
    end if;

    -- Pontos totais e semana anterior
    select coalesce(sum(performance_score), 0)
    into total_pts
    from player_performance_data
    where public.normalize_player_name(player_name) = any(match_names)
      and season = target_season;

    select coalesce(sum(performance_score), 0)
    into last_week_pts
    from player_performance_data
    where public.normalize_player_name(player_name) = any(match_names)
      and match_date >= last_week_start
      and match_date <= last_week_end
      and season = target_season;

    useful_total_pts := 0;
    useful_week_pts := 0;

    for selection_record in
      select
        wes.week_start_date,
        wes.week_end_date,
        case
          when exists (
            select 1 from jsonb_array_elements(wes.starting_eleven) elem
            where elem->>'id' = player_record.player_id::text
          ) then 1::numeric
          when exists (
            select 1 from jsonb_array_elements(wes.substitutes) elem
            where elem->>'id' = player_record.player_id::text
          ) then 0.5::numeric
          else 0::numeric
        end as weight
      from weekly_eleven_selections wes
      where wes.user_id = target_user_id
    loop
      if selection_record.weight <= 0 then
        continue;
      end if;

      select coalesce(sum(performance_score), 0)
      into week_points
      from player_performance_data
      where public.normalize_player_name(player_name) = any(match_names)
        and season = target_season
        and match_date >= selection_record.week_start_date
        and match_date <= selection_record.week_end_date;

      useful_total_pts := useful_total_pts + (week_points * selection_record.weight);

      if current_date between selection_record.week_start_date and selection_record.week_end_date then
        useful_week_pts := week_points * selection_record.weight;
      end if;
    end loop;

    insert into user_player_total_points (
      user_id, player_id,
      total_points, last_week_points,
      useful_total_points, useful_week_points,
      updated_at
    ) values (
      target_user_id,
      player_record.player_id,
      total_pts::integer,
      last_week_pts::integer,
      round(coalesce(useful_total_pts, 0))::integer,
      round(coalesce(useful_week_pts, 0))::integer,
      now()
    )
    on conflict (user_id, player_id) do update set
      total_points = excluded.total_points,
      last_week_points = excluded.last_week_points,
      useful_total_points = excluded.useful_total_points,
      useful_week_points = excluded.useful_week_points,
      updated_at = now();
  end loop;
end;
$$;

----------------------------------------------------------------------
-- Full recomputation across all users with the same matching rules
create or replace function public.update_user_player_points_from_performance()
returns void
language plpgsql
security definer
as $$
declare
  user_record record;
  player_record record;
  total_pts numeric;
  last_week_pts numeric;
  last_week_start date;
  last_week_end date;
  target_season text := '2025-2026';
  match_names text[];
  alias_names text[];
  selection_record record;
  week_points numeric;
  useful_total_pts numeric;
  useful_week_pts numeric;
begin
  -- Semana anterior (terça a segunda)
  last_week_end := current_date - extract(dow from current_date)::integer - 1;
  if extract(dow from current_date) = 0 then
    last_week_end := current_date - 1;
  elsif extract(dow from current_date) = 1 then
    last_week_end := current_date - 2;
  end if;
  last_week_start := last_week_end - 6;

  -- Temporada alvo (aceita 2025-2026 ou 2025/2026)
  select coalesce((
    select season
    from player_performance_data
    where season in ('2025-2026', '2025/2026')
    group by season
    order by count(*) desc, season desc
    limit 1
  ), target_season)
  into target_season;

  for user_record in select distinct user_id from user_player_selections loop
    for player_record in
      select ups.player_id, pp.name as player_name
      from user_player_selections ups
      join player_pool pp on pp.id = ups.player_id
      where ups.user_id = user_record.user_id
    loop
      match_names := array[public.normalize_player_name(player_record.player_name)];

      select coalesce(array_agg(public.normalize_player_name(perf_name)), array[]::text[])
      into alias_names
      from player_name_aliases
      where player_id = player_record.player_id;

      if alias_names is not null and array_length(alias_names, 1) > 0 then
        match_names := match_names || alias_names;
      end if;

      match_names := coalesce((
        select array(
          select distinct name
          from unnest(match_names) as name
          where name is not null
        )
      ), array[]::text[]);

      if array_length(match_names, 1) is null then
        match_names := array[public.normalize_player_name(player_record.player_name)];
      end if;

      select coalesce(sum(performance_score), 0)
      into total_pts
      from player_performance_data
      where public.normalize_player_name(player_name) = any(match_names)
        and season = target_season;

      select coalesce(sum(performance_score), 0)
      into last_week_pts
      from player_performance_data
      where public.normalize_player_name(player_name) = any(match_names)
        and match_date >= last_week_start
        and match_date <= last_week_end
        and season = target_season;

      useful_total_pts := 0;
      useful_week_pts := 0;

      for selection_record in
        select
          wes.week_start_date,
          wes.week_end_date,
          case
            when exists (
              select 1 from jsonb_array_elements(wes.starting_eleven) elem
              where elem->>'id' = player_record.player_id::text
            ) then 1::numeric
            when exists (
              select 1 from jsonb_array_elements(wes.substitutes) elem
              where elem->>'id' = player_record.player_id::text
            ) then 0.5::numeric
            else 0::numeric
          end as weight
        from weekly_eleven_selections wes
        where wes.user_id = user_record.user_id
      loop
        if selection_record.weight <= 0 then
          continue;
        end if;

        select coalesce(sum(performance_score), 0)
        into week_points
        from player_performance_data
        where public.normalize_player_name(player_name) = any(match_names)
          and season = target_season
          and match_date >= selection_record.week_start_date
          and match_date <= selection_record.week_end_date;

        useful_total_pts := useful_total_pts + (week_points * selection_record.weight);

        if current_date between selection_record.week_start_date and selection_record.week_end_date then
          useful_week_pts := week_points * selection_record.weight;
        end if;
      end loop;

      insert into user_player_total_points (
        user_id, player_id,
        total_points, last_week_points,
        useful_total_points, useful_week_points,
        updated_at
      ) values (
        user_record.user_id,
        player_record.player_id,
        total_pts::integer,
        last_week_pts::integer,
        round(coalesce(useful_total_pts, 0))::integer,
        round(coalesce(useful_week_pts, 0))::integer,
        now()
      )
      on conflict (user_id, player_id) do update set
        total_points = excluded.total_points,
        last_week_points = excluded.last_week_points,
        useful_total_points = excluded.useful_total_points,
        useful_week_points = excluded.useful_week_points,
        updated_at = now();
    end loop;
  end loop;
end;
$$;

----------------------------------------------------------------------
-- View that derives useful points directly from performance data
drop view if exists public.player_useful_points;

create or replace view public.player_useful_points as
with current_season as (
  select coalesce((
    select season
    from player_performance_data
    where season in ('2025-2026', '2025/2026')
    group by season
    order by count(*) desc, season desc
    limit 1
  ), '2025-2026') as season
),
selection_players as (
  select
    wes.user_id,
    wes.week_start_date,
    wes.week_end_date,
    (player_obj->>'id')::uuid as player_id,
    public.normalize_player_name(player_obj->>'name') as normalized_name,
    1::numeric as weight
  from weekly_eleven_selections wes
  cross join lateral jsonb_array_elements(wes.starting_eleven) as player_obj

  union all

  select
    wes.user_id,
    wes.week_start_date,
    wes.week_end_date,
    (player_obj->>'id')::uuid as player_id,
    public.normalize_player_name(player_obj->>'name') as normalized_name,
    0.5::numeric as weight
  from weekly_eleven_selections wes
  cross join lateral jsonb_array_elements(wes.substitutes) as player_obj
),
player_match_names as (
  select
    sp.user_id,
    sp.week_start_date,
    sp.week_end_date,
    sp.player_id,
    sp.weight,
    coalesce((
      select array(
        select distinct name
        from unnest(
          array[sp.normalized_name] ||
          coalesce((
            select array_agg(public.normalize_player_name(perf_name))
            from player_name_aliases
            where player_id = sp.player_id
          ), array[]::text[])
        ) as name
        where name is not null
      )
    ), array[]::text[]) as match_names
  from selection_players sp
),
normalized_performance as (
  select
    public.normalize_player_name(player_name) as normalized_name,
    match_date,
    performance_score,
    season
  from player_performance_data
)
select
  pm.player_id,
  pm.user_id,
  pm.week_start_date,
  pm.week_end_date,
  coalesce(sum(perf.performance_score * pm.weight), 0)::numeric as points_useful
from player_match_names pm
cross join current_season cs
left join normalized_performance perf
  on perf.normalized_name = any(pm.match_names)
 and perf.match_date >= pm.week_start_date
 and perf.match_date <= pm.week_end_date
 and perf.season = cs.season
group by pm.player_id, pm.user_id, pm.week_start_date, pm.week_end_date;
