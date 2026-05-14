create table if not exists public.listing_criteria_values (
  listing_id uuid not null references public.listings(id) on delete cascade,
  criterion_id uuid not null references public.rental_search_criteria(id) on delete cascade,
  value text not null default 'Unknown' check (value in ('Unknown', 'Yes', 'No')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (listing_id, criterion_id)
);

create index if not exists listing_criteria_values_criterion_idx
  on public.listing_criteria_values(criterion_id);

drop trigger if exists set_listing_criteria_values_updated_at on public.listing_criteria_values;
create trigger set_listing_criteria_values_updated_at
  before update on public.listing_criteria_values
  for each row
  execute function public.set_updated_at();

alter table public.listing_criteria_values enable row level security;

drop policy if exists "Listing criteria values are viewable by search members" on public.listing_criteria_values;
create policy "Listing criteria values are viewable by search members"
  on public.listing_criteria_values
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.listings
      where listings.id = listing_criteria_values.listing_id
        and public.is_search_member(listings.rental_search_id)
    )
  );

drop policy if exists "Listing criteria values are manageable by search members" on public.listing_criteria_values;
create policy "Listing criteria values are manageable by search members"
  on public.listing_criteria_values
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.listings
      where listings.id = listing_criteria_values.listing_id
        and public.is_search_member(listings.rental_search_id)
    )
  )
  with check (
    exists (
      select 1
      from public.listings
      join public.rental_search_criteria
        on rental_search_criteria.rental_search_id = listings.rental_search_id
      where listings.id = listing_criteria_values.listing_id
        and rental_search_criteria.id = listing_criteria_values.criterion_id
        and public.is_search_member(listings.rental_search_id)
    )
  );

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  rental_search_id uuid references public.rental_searches(id) on delete set null,
  page_path text,
  message text not null,
  status text not null default 'new' check (status in ('new', 'reviewed', 'closed')),
  created_at timestamptz not null default now()
);

create index if not exists feedback_workspace_created_idx
  on public.feedback(rental_search_id, created_at desc);

alter table public.feedback enable row level security;

drop policy if exists "Feedback is insertable by authenticated users" on public.feedback;
create policy "Feedback is insertable by authenticated users"
  on public.feedback
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and (
      rental_search_id is null
      or public.is_search_member(rental_search_id)
    )
  );

drop policy if exists "Feedback is viewable by workspace members or author" on public.feedback;
create policy "Feedback is viewable by workspace members or author"
  on public.feedback
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or (
      rental_search_id is not null
      and public.is_search_member(rental_search_id)
    )
  );

drop policy if exists "Feedback is updatable by workspace owners" on public.feedback;
create policy "Feedback is updatable by workspace owners"
  on public.feedback
  for update
  to authenticated
  using (
    rental_search_id is not null
    and public.is_search_owner(rental_search_id)
  )
  with check (
    rental_search_id is not null
    and public.is_search_owner(rental_search_id)
  );
