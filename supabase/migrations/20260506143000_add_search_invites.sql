create extension if not exists pgcrypto;

create table if not exists public.search_invites (
  id uuid primary key default gen_random_uuid(),
  rental_search_id uuid not null references public.rental_searches(id) on delete cascade,
  token text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists search_invites_rental_search_id_idx
  on public.search_invites(rental_search_id);

create index if not exists search_invites_created_by_idx
  on public.search_invites(created_by);

create index if not exists search_invites_token_idx
  on public.search_invites(token);

alter table public.search_invites enable row level security;

drop policy if exists "Search invites are viewable by owners" on public.search_invites;
create policy "Search invites are viewable by owners"
  on public.search_invites
  for select
  to authenticated
  using (public.is_search_owner(rental_search_id));

drop policy if exists "Search invites are creatable by owners" on public.search_invites;
create policy "Search invites are creatable by owners"
  on public.search_invites
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and public.is_search_owner(rental_search_id)
  );

drop policy if exists "Search invites are updatable by owners" on public.search_invites;
create policy "Search invites are updatable by owners"
  on public.search_invites
  for update
  to authenticated
  using (public.is_search_owner(rental_search_id))
  with check (public.is_search_owner(rental_search_id));

create or replace function public.accept_search_invite(invite_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_record public.search_invites%rowtype;
  current_user_id uuid;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'User must be authenticated';
  end if;

  select *
  into invite_record
  from public.search_invites
  where token = invite_token
  limit 1;

  if invite_record.id is null then
    raise exception 'Invite link is invalid';
  end if;

  if invite_record.used_at is not null then
    raise exception 'Invite link has already been used';
  end if;

  if invite_record.expires_at <= now() then
    raise exception 'Invite link has expired';
  end if;

  insert into public.search_members (rental_search_id, user_id, role)
  values (invite_record.rental_search_id, current_user_id, 'member')
  on conflict (rental_search_id, user_id) do nothing;

  update public.search_invites
  set used_at = now()
  where id = invite_record.id;

  return invite_record.rental_search_id;
end;
$$;

revoke all on function public.accept_search_invite(text)
  from public, anon;

grant execute on function public.accept_search_invite(text)
  to authenticated;
