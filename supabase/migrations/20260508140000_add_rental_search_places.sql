create table if not exists public.rental_search_places (
  id uuid primary key default gen_random_uuid(),
  rental_search_id uuid not null references public.rental_searches(id) on delete cascade,
  name text not null,
  address text not null,
  latitude double precision,
  longitude double precision,
  formatted_address text,
  geocoded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rental_search_places_search_id_idx
  on public.rental_search_places(rental_search_id);

drop trigger if exists set_rental_search_places_updated_at on public.rental_search_places;
create trigger set_rental_search_places_updated_at
  before update on public.rental_search_places
  for each row
  execute function public.set_updated_at();

alter table public.rental_search_places enable row level security;

drop policy if exists "Rental search places are viewable by members" on public.rental_search_places;
create policy "Rental search places are viewable by members"
  on public.rental_search_places
  for select
  to authenticated
  using (public.is_search_member(rental_search_id));

drop policy if exists "Rental search places are insertable by owners" on public.rental_search_places;
create policy "Rental search places are insertable by owners"
  on public.rental_search_places
  for insert
  to authenticated
  with check (public.is_search_owner(rental_search_id));

drop policy if exists "Rental search places are updatable by owners" on public.rental_search_places;
create policy "Rental search places are updatable by owners"
  on public.rental_search_places
  for update
  to authenticated
  using (public.is_search_owner(rental_search_id))
  with check (public.is_search_owner(rental_search_id));

drop policy if exists "Rental search places are deletable by owners" on public.rental_search_places;
create policy "Rental search places are deletable by owners"
  on public.rental_search_places
  for delete
  to authenticated
  using (public.is_search_owner(rental_search_id));
