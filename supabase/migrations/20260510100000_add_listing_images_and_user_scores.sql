create table if not exists public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  image_url text not null,
  position integer not null default 0,
  source text not null default 'manual',
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists contact_email text;

create index if not exists listing_images_listing_position_idx
  on public.listing_images(listing_id, position, created_at);

create table if not exists public.listing_scores (
  listing_id uuid not null references public.listings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  score integer check (score between 1 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (listing_id, user_id)
);

create index if not exists listing_scores_user_id_idx
  on public.listing_scores(user_id);

drop trigger if exists set_listing_scores_updated_at on public.listing_scores;
create trigger set_listing_scores_updated_at
  before update on public.listing_scores
  for each row
  execute function public.set_updated_at();

insert into public.listing_images (listing_id, image_url, position, source)
select id, cover_image_url, 0, 'cover_backfill'
from public.listings
where cover_image_url is not null
  and cover_image_url <> ''
  and not exists (
    select 1
    from public.listing_images
    where listing_images.listing_id = listings.id
      and listing_images.image_url = listings.cover_image_url
  );

insert into public.listing_scores (listing_id, user_id, score)
select listings.id, profiles.id, listings.sasha_score
from public.listings
join public.profiles
  on lower(coalesce(profiles.nickname, profiles.full_name, '')) like '%sasha%'
where listings.sasha_score between 1 and 10
on conflict (listing_id, user_id) do update
  set score = excluded.score;

insert into public.listing_scores (listing_id, user_id, score)
select listings.id, profiles.id, listings.gleb_score
from public.listings
join public.profiles
  on lower(coalesce(profiles.nickname, profiles.full_name, '')) like '%gleb%'
where listings.gleb_score between 1 and 10
on conflict (listing_id, user_id) do update
  set score = excluded.score;

alter table public.listing_images enable row level security;
alter table public.listing_scores enable row level security;

drop policy if exists "Listing images are viewable by search members" on public.listing_images;
create policy "Listing images are viewable by search members"
  on public.listing_images
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.listings
      where listings.id = listing_images.listing_id
        and public.is_search_member(listings.rental_search_id)
    )
  );

drop policy if exists "Listing images are manageable by search members" on public.listing_images;
create policy "Listing images are manageable by search members"
  on public.listing_images
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.listings
      where listings.id = listing_images.listing_id
        and public.is_search_member(listings.rental_search_id)
    )
  )
  with check (
    exists (
      select 1
      from public.listings
      where listings.id = listing_images.listing_id
        and public.is_search_member(listings.rental_search_id)
    )
  );

drop policy if exists "Listing scores are viewable by search members" on public.listing_scores;
create policy "Listing scores are viewable by search members"
  on public.listing_scores
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.listings
      where listings.id = listing_scores.listing_id
        and public.is_search_member(listings.rental_search_id)
    )
  );

drop policy if exists "Users can create their own listing scores" on public.listing_scores;
create policy "Users can create their own listing scores"
  on public.listing_scores
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.listings
      where listings.id = listing_scores.listing_id
        and public.is_search_member(listings.rental_search_id)
    )
  );

drop policy if exists "Users can update their own listing scores" on public.listing_scores;
create policy "Users can update their own listing scores"
  on public.listing_scores
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.listings
      where listings.id = listing_scores.listing_id
        and public.is_search_member(listings.rental_search_id)
    )
  );

drop policy if exists "Users can delete their own listing scores" on public.listing_scores;
create policy "Users can delete their own listing scores"
  on public.listing_scores
  for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Profiles are viewable by workspace collaborators" on public.profiles;
create policy "Profiles are viewable by workspace collaborators"
  on public.profiles
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.search_members current_member
      join public.search_members profile_member
        on profile_member.rental_search_id = current_member.rental_search_id
      where current_member.user_id = auth.uid()
        and profile_member.user_id = profiles.id
    )
  );
