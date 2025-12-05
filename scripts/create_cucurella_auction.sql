-- Template to create an active auction for any player.
-- Edit only the two lines in the "params" CTE before running.
--   player_name     -> exact or partial name of the player in player_pool
--   starting_bid_fl -> starting/current bid in Footledgers (FL)

with params as (
  select
    'Marc Cucurella'::text as player_name,
    7::numeric        as starting_bid_fl
),
target as (
  select id, name, position, club, league, value
  from player_pool
  where lower(name) like lower('%' || (select player_name from params) || '%')
  limit 1
),
ap as (
  insert into auction_players (id, name, position, club, league, value, image_url, description)
  select gen_random_uuid(), name, position, club, league, value, null,
         'Leilão automático criado por script'
  from target
  returning id
)
insert into auctions (auction_player_id, start_date, end_date, starting_bid, current_bid, status)
select ap.id,
       now(),
       date_trunc('week', now()) + interval '7 days' + interval '12 hours', -- próxima 2ª às 12h
       (select starting_bid_fl from params),
       (select starting_bid_fl from params),
       'active'
from ap;
