-- Game-scoped custom stations. Addresses are removed automatically when a game ends.

alter table public.game_holes alter column bar_id drop not null;
alter table public.game_holes add column if not exists custom_name text;
alter table public.game_holes add column if not exists custom_address text;
alter table public.game_holes add column if not exists custom_latitude double precision;
alter table public.game_holes add column if not exists custom_longitude double precision;

alter table public.game_holes add constraint game_holes_station_source
check (bar_id is not null or custom_name is not null);

create or replace function public.create_custom_game(
  p_stations jsonb,
  p_wheel_count integer default 0,
  p_wheel_mode public.wheel_mode default 'classic',
  p_random_min integer default 1,
  p_random_max integer default 3
)
returns table(game_id bigint, code text)
language plpgsql
security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_game public.games%rowtype;
  v_holes integer := jsonb_array_length(coalesce(p_stations, '[]'::jsonb));
begin
  if v_user is null then raise exception 'Not authenticated'; end if;
  if v_holes < 2 or v_holes > 18 then raise exception 'Choose between 2 and 18 stations'; end if;
  if p_wheel_count < 0 or p_wheel_count > v_holes then raise exception 'Invalid Wheel count'; end if;
  if p_random_min < 1 or p_random_max < p_random_min then raise exception 'Invalid random range'; end if;
  if exists (
    select 1 from jsonb_array_elements(p_stations) station
    where length(trim(coalesce(station->>'name', ''))) < 1
       or length(trim(coalesce(station->>'name', ''))) > 80
       or length(trim(coalesce(station->>'address', ''))) < 3
       or length(trim(coalesce(station->>'address', ''))) > 200
  ) then raise exception 'Invalid custom station'; end if;

  insert into public.games(host_id, holes, wheel_count, wheel_mode, random_min, random_max)
  values (v_user, v_holes, p_wheel_count, p_wheel_mode, p_random_min, p_random_max)
  returning * into v_game;

  insert into public.game_players(game_id, user_id) values (v_game.id, v_user);

  with stations as (
    select ordinality, trim(station->>'name') as name, trim(station->>'address') as address,
           (station->>'latitude')::double precision as latitude,
           (station->>'longitude')::double precision as longitude
    from jsonb_array_elements(p_stations) with ordinality as selected(station, ordinality)
  ), wheel_holes as (
    select n from generate_series(1, v_holes) n order by random() limit p_wheel_count
  )
  insert into public.game_holes(game_id, hole_number, bar_id, custom_name, custom_address, custom_latitude, custom_longitude, wheel_enabled)
  select v_game.id, ordinality::smallint, null, name, address, latitude, longitude,
         exists(select 1 from wheel_holes wh where wh.n = ordinality)
  from stations;

  return query select v_game.id, v_game.code;
end;
$$;

create or replace function public.clear_finished_custom_addresses()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status = 'finished' and old.status is distinct from new.status then
    update public.game_holes set custom_address = null, custom_latitude = null, custom_longitude = null
    where game_id = new.id and bar_id is null;
  end if;
  return new;
end;
$$;

drop trigger if exists clear_custom_addresses_when_game_finishes on public.games;
create trigger clear_custom_addresses_when_game_finishes
after update of status on public.games
for each row execute function public.clear_finished_custom_addresses();

grant execute on function public.create_custom_game(jsonb, integer, public.wheel_mode, integer, integer) to authenticated;
