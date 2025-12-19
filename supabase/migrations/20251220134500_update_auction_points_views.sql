drop view if exists public.user_useful_points_totals;
drop view if exists public.user_auction_used_points;
drop view if exists public.user_auction_useful_points;
drop view if exists public.auction_player_totals;

create view public.user_auction_useful_points as
with season_choice as (
  select coalesce((
    select season
    from player_performance_data
    where season in ('2025-2026', '2025/2026')
    group by season
    order by count(*) desc, season desc
    limit 1
  ), '2025-2026') as target_season
),
active_wins as (
  select
    uaw.id as win_id,
    uaw.user_id,
    uaw.auction_player_id,
    uaw.won_at,
    ap.name as player_name,
    ap.position,
    ap.club,
    ap.league,
    ap.value as player_value
  from user_auction_wins uaw
  join auction_players ap on ap.id = uaw.auction_player_id
  where coalesce(uaw.is_used, false) = false
),
normalized_performance as (
  select
    public.normalize_player_name(player_name) as normalized_name,
    performance_score,
    season
  from player_performance_data
)
select
  aw.win_id,
  aw.user_id,
  aw.auction_player_id,
  aw.player_name,
  aw.position,
  aw.club,
  aw.league,
  aw.player_value,
  aw.won_at,
  coalesce(sum(perf.performance_score), 0)::numeric as total_points
from active_wins aw
cross join season_choice sc
left join normalized_performance perf
  on perf.normalized_name = public.normalize_player_name(aw.player_name)
 and perf.season = sc.target_season
group by aw.win_id, aw.user_id, aw.auction_player_id, aw.player_name,
  aw.position, aw.club, aw.league, aw.player_value, aw.won_at;

create view public.user_auction_used_points as
with season_choice as (
  select coalesce((
    select season
    from player_performance_data
    where season in ('2025-2026', '2025/2026')
    group by season
    order by count(*) desc, season desc
    limit 1
  ), '2025-2026') as target_season
),
used_wins as (
  select
    uaw.id as win_id,
    uaw.user_id,
    uaw.auction_player_id,
    ap.name as player_name,
    ap.position,
    ap.club,
    ap.league,
    ap.value as player_value,
    uaw.used_in_week::date as used_date,
    date_trunc('week', uaw.used_in_week)::date as week_start,
    (date_trunc('week', uaw.used_in_week)::date + interval '6 days')::date as week_end
  from user_auction_wins uaw
  join auction_players ap on ap.id = uaw.auction_player_id
  where coalesce(uaw.is_used, false) = true
    and uaw.used_in_week is not null
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
  uw.win_id,
  uw.user_id,
  uw.auction_player_id,
  uw.player_name,
  uw.position,
  uw.club,
  uw.league,
  uw.player_value,
  uw.used_date,
  uw.week_start,
  uw.week_end,
  coalesce(sum(perf.performance_score), 0)::numeric as useful_points
from used_wins uw
cross join season_choice sc
left join normalized_performance perf
  on perf.normalized_name = public.normalize_player_name(uw.player_name)
 and perf.season = sc.target_season
 and perf.match_date >= uw.week_start
 and perf.match_date <= uw.week_end
group by uw.win_id, uw.user_id, uw.auction_player_id, uw.player_name,
  uw.position, uw.club, uw.league, uw.player_value, uw.used_date,
  uw.week_start, uw.week_end;

create view public.user_useful_points_totals as
select
  user_id,
  coalesce(sum(points), 0)::numeric as useful_points
from (
  select user_id, useful_total_points::numeric as points
  from user_player_total_points
  union all
  select user_id, useful_points
  from user_auction_used_points
) t
group by user_id;

create view public.auction_player_totals as
with season_choice as (
  select coalesce((
    select season
    from player_performance_data
    where season in ('2025-2026', '2025/2026')
    group by season
    order by count(*) desc, season desc
    limit 1
  ), '2025-2026') as target_season
),
normalized_performance as (
  select
    public.normalize_player_name(player_name) as normalized_name,
    performance_score,
    season
  from player_performance_data
)
select
  ap.id as auction_player_id,
  ap.name,
  ap.position,
  ap.club,
  ap.league,
  ap.value,
  coalesce(sum(perf.performance_score), 0)::numeric as total_points
from auction_players ap
cross join season_choice sc
left join normalized_performance perf
  on perf.normalized_name = public.normalize_player_name(ap.name)
 and perf.season = sc.target_season
group by ap.id, ap.name, ap.position, ap.club, ap.league, ap.value;

grant select on public.user_auction_useful_points to anon, authenticated, service_role;
grant select on public.user_auction_used_points to anon, authenticated, service_role;
grant select on public.user_useful_points_totals to anon, authenticated, service_role;
grant select on public.auction_player_totals to anon, authenticated, service_role;
