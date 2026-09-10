-- Optional seed that mirrors the Umeå bars referenced by the original mobile app.
-- Safe to run after 001_initial.sql: it only inserts names that are not already present.

insert into public.bars (name, city)
select seed.name, 'Umeå'
from (values
  ('Megazone'),
  ('Lion Bar'),
  ('Kappa Bar'),
  ('O''Learys'),
  ('Orangeriet'),
  ('Allstar'),
  ('Harrys'),
  ('Sjöbris'),
  ('Lottas Krog & Pub')
) as seed(name)
where not exists (
  select 1 from public.bars b where lower(b.name) = lower(seed.name) and b.city = 'Umeå'
);

-- Add leave-lobby support to projects that already ran the first starter migration.
create or replace function public.leave_game(p_code text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_game public.games%rowtype;
begin
  if v_user is null then raise exception 'Not authenticated'; end if;
  select * into v_game from public.games where code = upper(trim(p_code));
  if v_game.id is null then return; end if;

  if v_game.host_id = v_user and v_game.status = 'lobby' then
    delete from public.games where id = v_game.id;
  else
    delete from public.game_players where game_id = v_game.id and user_id = v_user;
  end if;
end;
$$;

grant execute on function public.leave_game(text) to authenticated;
