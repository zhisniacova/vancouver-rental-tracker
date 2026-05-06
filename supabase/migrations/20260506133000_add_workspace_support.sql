create extension if not exists pgcrypto;

create table if not exists public.rental_searches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.search_members (
  rental_search_id uuid not null references public.rental_searches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (rental_search_id, user_id)
);

alter table public.listings
  add column if not exists rental_search_id uuid references public.rental_searches(id) on delete set null;

create index if not exists rental_searches_owner_id_idx
  on public.rental_searches(owner_id);

create index if not exists search_members_user_id_idx
  on public.search_members(user_id);

create index if not exists listings_rental_search_id_idx
  on public.listings(rental_search_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_rental_searches_updated_at on public.rental_searches;
create trigger set_rental_searches_updated_at
  before update on public.rental_searches
  for each row
  execute function public.set_updated_at();

create or replace function public.is_search_member(
  search_id uuid,
  member_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.search_members
    where rental_search_id = search_id
      and user_id = member_id
  );
$$;

create or replace function public.is_search_owner(
  search_id uuid,
  member_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.search_members
    where rental_search_id = search_id
      and user_id = member_id
      and role = 'owner'
  );
$$;

create or replace function public.handle_new_rental_search_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.search_members (rental_search_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (rental_search_id, user_id) do update
    set role = 'owner';

  return new;
end;
$$;

drop trigger if exists on_rental_search_created on public.rental_searches;
create trigger on_rental_search_created
  after insert on public.rental_searches
  for each row
  execute function public.handle_new_rental_search_owner();

create or replace function public.assign_existing_listings_to_owner_workspace(
  workspace_owner_id uuid,
  workspace_name text default 'Migrated rental search'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  workspace_id uuid;
begin
  if workspace_owner_id is null then
    raise exception 'workspace_owner_id is required';
  end if;

  select id
  into workspace_id
  from public.rental_searches
  where owner_id = workspace_owner_id
    and name = workspace_name
  order by created_at
  limit 1;

  if workspace_id is null then
    insert into public.rental_searches (name, owner_id)
    values (workspace_name, workspace_owner_id)
    returning id into workspace_id;
  end if;

  insert into public.search_members (rental_search_id, user_id, role)
  values (workspace_id, workspace_owner_id, 'owner')
  on conflict (rental_search_id, user_id) do update
    set role = 'owner';

  update public.listings
  set rental_search_id = workspace_id
  where rental_search_id is null;

  return workspace_id;
end;
$$;

revoke all on function public.assign_existing_listings_to_owner_workspace(uuid, text)
  from public, anon, authenticated;

select public.assign_existing_listings_to_owner_workspace(
  'c3d5a937-597d-4c95-ade2-2aeff213b31e'::uuid,
  'My Rental Search'
);

alter table public.rental_searches enable row level security;
alter table public.search_members enable row level security;
alter table public.listings enable row level security;

drop policy if exists "Rental searches are viewable by members" on public.rental_searches;
create policy "Rental searches are viewable by members"
  on public.rental_searches
  for select
  to authenticated
  using (public.is_search_member(id));

drop policy if exists "Users can create owned rental searches" on public.rental_searches;
create policy "Users can create owned rental searches"
  on public.rental_searches
  for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "Rental searches are updatable by owners" on public.rental_searches;
create policy "Rental searches are updatable by owners"
  on public.rental_searches
  for update
  to authenticated
  using (public.is_search_owner(id))
  with check (public.is_search_owner(id));

drop policy if exists "Rental searches are deletable by owners" on public.rental_searches;
create policy "Rental searches are deletable by owners"
  on public.rental_searches
  for delete
  to authenticated
  using (public.is_search_owner(id));

drop policy if exists "Search members are viewable by search members" on public.search_members;
create policy "Search members are viewable by search members"
  on public.search_members
  for select
  to authenticated
  using (public.is_search_member(rental_search_id));

drop policy if exists "Search members are manageable by owners" on public.search_members;
create policy "Search members are manageable by owners"
  on public.search_members
  for all
  to authenticated
  using (public.is_search_owner(rental_search_id))
  with check (public.is_search_owner(rental_search_id));

drop policy if exists "Listings are viewable by search members" on public.listings;
create policy "Listings are viewable by search members"
  on public.listings
  for select
  to authenticated
  using (public.is_search_member(rental_search_id));

drop policy if exists "Listings are insertable by search members" on public.listings;
create policy "Listings are insertable by search members"
  on public.listings
  for insert
  to authenticated
  with check (
    rental_search_id is not null
    and public.is_search_member(rental_search_id)
  );

drop policy if exists "Listings are updatable by search members" on public.listings;
create policy "Listings are updatable by search members"
  on public.listings
  for update
  to authenticated
  using (public.is_search_member(rental_search_id))
  with check (
    rental_search_id is not null
    and public.is_search_member(rental_search_id)
  );

drop policy if exists "Listings are deletable by search members" on public.listings;
create policy "Listings are deletable by search members"
  on public.listings
  for delete
  to authenticated
  using (public.is_search_member(rental_search_id));
