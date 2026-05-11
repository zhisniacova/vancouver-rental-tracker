create table if not exists public.rental_search_criteria (
  id uuid primary key default gen_random_uuid(),
  rental_search_id uuid not null references public.rental_searches(id) on delete cascade,
  key text not null,
  label text not null,
  builtin_key text,
  keywords text[] not null default '{}',
  archived_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (rental_search_id, key)
);

create table if not exists public.search_member_criteria_preferences (
  rental_search_id uuid not null references public.rental_searches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  criterion_id uuid not null references public.rental_search_criteria(id) on delete cascade,
  importance text not null check (importance in ('must-have', 'important', 'nice-to-have', 'not important')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (rental_search_id, user_id, criterion_id)
);

create index if not exists rental_search_criteria_search_idx
  on public.rental_search_criteria(rental_search_id, archived_at);

create index if not exists member_criteria_preferences_user_idx
  on public.search_member_criteria_preferences(user_id);

drop trigger if exists set_rental_search_criteria_updated_at on public.rental_search_criteria;
create trigger set_rental_search_criteria_updated_at
  before update on public.rental_search_criteria
  for each row
  execute function public.set_updated_at();

drop trigger if exists set_member_criteria_preferences_updated_at on public.search_member_criteria_preferences;
create trigger set_member_criteria_preferences_updated_at
  before update on public.search_member_criteria_preferences
  for each row
  execute function public.set_updated_at();

insert into public.rental_search_criteria (rental_search_id, key, label, builtin_key, keywords, created_by)
select rental_searches.id, defaults.key, defaults.label, defaults.builtin_key, defaults.keywords, rental_searches.owner_id
from public.rental_searches
cross join (
  values
    ('parking', 'Parking', 'parking', array['parking', 'parking stall', 'secure parking']),
    ('storage', 'Storage', 'storage', array['storage', 'storage locker']),
    ('gym', 'Gym', 'gym', array['gym', 'fitness centre', 'fitness center']),
    ('in_suite_laundry', 'In-suite laundry', 'inSuiteLaundry', array['in-suite laundry', 'in suite laundry', 'ensuite laundry', 'washer dryer in suite']),
    ('pets', 'Pets / pet policy', 'pets', array['pets', 'pet friendly', 'cats', 'dogs']),
    ('furnished', 'Furnished', 'furnished', array['furnished'])
) as defaults(key, label, builtin_key, keywords)
on conflict (rental_search_id, key) do nothing;

insert into public.search_member_criteria_preferences (rental_search_id, user_id, criterion_id, importance)
select
  search_members.rental_search_id,
  search_members.user_id,
  criteria.id,
  case criteria.builtin_key
    when 'parking' then coalesce(rental_searches.criteria_preferences -> 'criteria' ->> 'parking', 'important')
    when 'storage' then coalesce(rental_searches.criteria_preferences -> 'criteria' ->> 'storage', 'nice-to-have')
    when 'gym' then coalesce(rental_searches.criteria_preferences -> 'criteria' ->> 'gym', 'nice-to-have')
    when 'inSuiteLaundry' then coalesce(rental_searches.criteria_preferences -> 'criteria' ->> 'inSuiteLaundry', 'important')
    when 'pets' then coalesce(rental_searches.criteria_preferences -> 'criteria' ->> 'pets', 'not important')
    when 'furnished' then coalesce(rental_searches.criteria_preferences -> 'criteria' ->> 'furnished', 'not important')
    else 'not important'
  end
from public.search_members
join public.rental_searches
  on rental_searches.id = search_members.rental_search_id
join public.rental_search_criteria criteria
  on criteria.rental_search_id = search_members.rental_search_id
on conflict (rental_search_id, user_id, criterion_id) do nothing;

alter table public.rental_search_criteria enable row level security;
alter table public.search_member_criteria_preferences enable row level security;

drop policy if exists "Criteria are viewable by search members" on public.rental_search_criteria;
create policy "Criteria are viewable by search members"
  on public.rental_search_criteria
  for select
  to authenticated
  using (public.is_search_member(rental_search_id));

drop policy if exists "Criteria are manageable by search members" on public.rental_search_criteria;
create policy "Criteria are manageable by search members"
  on public.rental_search_criteria
  for all
  to authenticated
  using (public.is_search_member(rental_search_id))
  with check (public.is_search_member(rental_search_id));

drop policy if exists "Member criteria preferences are viewable by search members" on public.search_member_criteria_preferences;
create policy "Member criteria preferences are viewable by search members"
  on public.search_member_criteria_preferences
  for select
  to authenticated
  using (public.is_search_member(rental_search_id));

drop policy if exists "Users can manage their own criteria preferences" on public.search_member_criteria_preferences;
create policy "Users can manage their own criteria preferences"
  on public.search_member_criteria_preferences
  for all
  to authenticated
  using (user_id = auth.uid() and public.is_search_member(rental_search_id))
  with check (user_id = auth.uid() and public.is_search_member(rental_search_id));
