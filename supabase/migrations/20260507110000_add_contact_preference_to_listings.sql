alter table public.listings
  add column if not exists contact_medium text,
  add column if not exists contact_details text;
