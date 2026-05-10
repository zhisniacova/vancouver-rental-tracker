alter table public.profiles
  add column if not exists preferred_email_provider text;

update public.profiles
set preferred_email_provider = 'gmail'
where preferred_email_provider is null;

alter table public.profiles
  alter column preferred_email_provider set default 'gmail';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_preferred_email_provider_check'
  ) then
    alter table public.profiles
      add constraint profiles_preferred_email_provider_check
      check (
        preferred_email_provider in ('default_app', 'gmail', 'outlook')
      );
  end if;
end;
$$;
