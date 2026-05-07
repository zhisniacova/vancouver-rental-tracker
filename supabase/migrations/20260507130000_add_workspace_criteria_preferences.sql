alter table public.rental_searches
  add column if not exists criteria_preferences jsonb not null default '{
    "criteria": {
      "parking": "important",
      "storage": "nice-to-have",
      "gym": "nice-to-have",
      "inSuiteLaundry": "important",
      "pets": "not important",
      "furnished": "not important"
    },
    "maxRent": null,
    "targetSqft": null,
    "minimumSqft": null
  }'::jsonb;
