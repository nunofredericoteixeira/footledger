alter table if exists public.user_auction_wins
  add constraint user_auction_wins_auction_unique unique (auction_id);

create or replace function public.sync_auction_wins()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
begin
  with winners as (
    select
      a.id as auction_id,
      a.auction_player_id,
      win.user_id,
      coalesce(a.end_date, win.created_at, now()) as won_at
    from auctions a
    join lateral (
      select
        b.user_id,
        b.bid_amount,
        b.created_at
      from auction_bids b
      where b.auction_id = a.id
      order by b.bid_amount desc, b.created_at asc
      limit 1
    ) win on true
    where win.user_id is not null
      and (
        coalesce(a.status, 'completed') not in ('active', 'preview')
        or (a.end_date is not null and a.end_date <= now())
      )
  )
  insert into user_auction_wins (
    user_id,
    auction_id,
    auction_player_id,
    won_at,
    is_used,
    created_at
  )
  select
    w.user_id,
    w.auction_id,
    w.auction_player_id,
    w.won_at,
    false,
    now()
  from winners w
  where not exists (
    select 1
    from user_auction_wins existing
    where existing.auction_id = w.auction_id
  );

  -- Ensure auctions have the winner recorded
  update auctions a
  set winner_user_id = uaw.user_id
  from user_auction_wins uaw
  where a.id = uaw.auction_id
    and (a.winner_user_id is distinct from uaw.user_id or a.winner_user_id is null);
end;
$$;

grant execute on function public.sync_auction_wins() to anon, authenticated, service_role;

select public.sync_auction_wins();
