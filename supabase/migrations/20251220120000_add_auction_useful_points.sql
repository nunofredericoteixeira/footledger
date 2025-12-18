-- View summarizing useful points for un-used auction rewards
create or replace view public.user_auction_useful_points as
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
    ap.name as player_name,
    ap.position,
    ap.club,
    ap.league
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
  coalesce(sum(perf.performance_score), 0)::numeric as useful_points
from active_wins aw
cross join season_choice sc
left join normalized_performance perf
  on perf.normalized_name = public.normalize_player_name(aw.player_name)
 and perf.season = sc.target_season
group by aw.win_id, aw.user_id, aw.auction_player_id, aw.player_name, aw.position, aw.club, aw.league;

-- Aggregate useful points from standard roster and auction rewards
create or replace view public.user_useful_points_totals as
select
  user_id,
  coalesce(sum(points), 0)::numeric as useful_points
from (
  select user_id, useful_total_points::numeric as points
  from user_player_total_points
  union all
  select user_id, useful_points
  from user_auction_useful_points
) t
group by user_id;

grant select on public.user_auction_useful_points to anon, authenticated, service_role;
grant select on public.user_useful_points_totals to anon, authenticated, service_role;
