alter table public.listings
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists formatted_address text,
  add column if not exists geocoded_at timestamptz;
