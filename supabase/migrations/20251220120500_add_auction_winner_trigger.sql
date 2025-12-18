create or replace function public.create_user_auction_win()
returns trigger
language plpgsql
security definer
as $$
begin
  if NEW.winner_user_id is null then
    return NEW;
  end if;

  if TG_OP = 'INSERT' or (OLD.winner_user_id is distinct from NEW.winner_user_id) then
    if not exists (
      select 1
      from user_auction_wins
      where auction_id = NEW.id
    ) then
      insert into user_auction_wins (
        user_id,
        auction_id,
        auction_player_id,
        won_at,
        is_used,
        created_at
      ) values (
        NEW.winner_user_id,
        NEW.id,
        NEW.auction_player_id,
        coalesce(NEW.updated_at, NEW.end_date, now()),
        false,
        now()
      );
    end if;
  end if;

  return NEW;
end;
$$;

drop trigger if exists trigger_create_user_auction_win on public.auctions;

create trigger trigger_create_user_auction_win
after insert or update on public.auctions
for each row
when (NEW.winner_user_id is not null)
execute function public.create_user_auction_win();

-- Backfill any missing rows for past completed auctions
insert into user_auction_wins (user_id, auction_id, auction_player_id, won_at, is_used, created_at)
select
  a.winner_user_id,
  a.id,
  a.auction_player_id,
  coalesce(a.updated_at, a.end_date, now()),
  coalesce(uaw.is_used, false),
  now()
from auctions a
left join user_auction_wins uaw on uaw.auction_id = a.id
where a.winner_user_id is not null
  and uaw.id is null;
