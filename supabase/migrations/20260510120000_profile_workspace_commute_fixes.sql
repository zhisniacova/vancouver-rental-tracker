alter table public.rental_search_places
  add column if not exists max_drive_minutes integer check (max_drive_minutes is null or max_drive_minutes > 0),
  add column if not exists max_transit_minutes integer check (max_transit_minutes is null or max_transit_minutes > 0);

insert into public.profiles (id, nickname, full_name, contact_email)
select
  users.id,
  nullif(users.raw_user_meta_data ->> 'nickname', ''),
  nullif(users.raw_user_meta_data ->> 'full_name', ''),
  users.email
from auth.users
where not exists (
  select 1
  from public.profiles
  where profiles.id = users.id
);

update public.profiles
set contact_email = auth_users.email
from auth.users as auth_users
where profiles.id = auth_users.id
  and profiles.contact_email is null;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nickname, full_name, contact_email)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'nickname', ''),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    new.email
  )
  on conflict (id) do update
    set contact_email = coalesce(public.profiles.contact_email, excluded.contact_email);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user_profile();

drop policy if exists "Rental search places are insertable by owners" on public.rental_search_places;
create policy "Rental search places are insertable by members"
  on public.rental_search_places
  for insert
  to authenticated
  with check (public.is_search_member(rental_search_id));

drop policy if exists "Rental search places are updatable by owners" on public.rental_search_places;
create policy "Rental search places are updatable by members"
  on public.rental_search_places
  for update
  to authenticated
  using (public.is_search_member(rental_search_id))
  with check (public.is_search_member(rental_search_id));

drop policy if exists "Rental search places are deletable by owners" on public.rental_search_places;
create policy "Rental search places are deletable by members"
  on public.rental_search_places
  for delete
  to authenticated
  using (public.is_search_member(rental_search_id));

create or replace function public.create_rental_search(search_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_search_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if nullif(trim(search_name), '') is null then
    raise exception 'Workspace name is required';
  end if;

  insert into public.rental_searches (name, owner_id)
  values (trim(search_name), auth.uid())
  returning id into new_search_id;

  return new_search_id;
end;
$$;

revoke all on function public.create_rental_search(text) from public, anon;
grant execute on function public.create_rental_search(text) to authenticated;
