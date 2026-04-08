# Vancouver Rental Tracker

Deployed Site: [rental-search-tracker.vercel.app](https://rental-search-tracker.vercel.app/)

A full-stack web app for managing the rental search process collaboratively.

Built for two active users (Sasha and Gleb), this project turns scattered listing links and ad-hoc messages into a structured workflow: discover listings, score and shortlist them, track outreach, and manage viewings in one place.

## Why This Project Matters

Apartment hunting is a high-frequency, high-noise problem. This app was designed to reduce decision fatigue and coordination overhead by:

- centralizing listing data and communication history
- making shortlist decisions objective with shared scoring + likes
- surfacing priority items with action-oriented dashboard sections
- preserving timeline context (messaged date, viewings, past interactions)

## Key Features

- Listing lifecycle management: create, edit, delete, and status updates (`new`, `messaged`, `viewing_scheduled`, `viewed`, `expired`)
- Smart dashboard UX:
  - search + multi-filter controls (neighborhood, status, likes, sorting)
  - "Top Picks" section for mutually liked, high-score listings
  - "Needs Action" section for listings both users liked but haven’t messaged yet
- Dual-user collaboration model (no auth yet):
  - user context switcher (`Sasha` / `Gleb`)
  - persisted local preference via `localStorage`
- Messaging workflow:
  - templated Email / Website Message / SMS drafts
  - one-click Gmail compose deep-link
  - message history persisted in `listing_messages`
  - auto-updates `messaged_at`, `messaged_by`, and listing status
- Viewing scheduler page (`/viewings`):
  - grouped by day
  - separated into upcoming vs past sections
- Data quality + flexibility:
  - dynamic neighborhoods table (read + create)
  - image support via URL and uploaded cover images
- Listing health check API:
  - server route fetches original listing URL and flags expired/removed postings

## Tech Stack

- Next.js 16 (App Router, React Server Components + client components where needed)
- React 19
- TypeScript
- Supabase
  - Postgres (application data)
  - Storage (listing images)
- Tailwind CSS 4
- ESLint 9

## Architecture Snapshot

- `app/`
  - server-rendered routes for dashboard, listing details, editing, messaging, and viewings
  - API route: `app/api/check-listing/route.ts`
- `components/`
  - reusable UI and feature components (listing cards/forms, filters, status badges, message composer)
- `lib/`
  - Supabase client utilities
- Data model (core tables):
  - `listings`
  - `listing_likes`
  - `listing_messages`
  - `neighborhoods`

## Product Decisions

- Deliberately postponed auth to optimize for speed of iteration and real usage feedback.
- Used explicit statuses + timestamps to make workflow state visible at a glance.
- Split dashboard into “decision support” sections (`Top Picks`, `Needs Action`) instead of only a raw list.
- Chose server-rendered data reads for simple, reliable freshness in core pages.

## Local Development

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment

Create `.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### 3) Run the app

```bash
npm run dev
```

Open `http://localhost:3000`.

## Scripts

- `npm run dev` - start development server
- `npm run build` - production build
- `npm run start` - run production server
- `npm run lint` - run ESLint

## Resume-Ready Highlights

- Designed and shipped a full-stack workflow product with real multi-user collaboration constraints.
- Implemented end-to-end messaging operations with persisted audit trail and state transitions.
- Built prioritization logic (shared likes + scoring) to convert noisy data into actionable decisions.
- Modeled and integrated normalized relational tables in Supabase to support evolving product features.

## Next Roadmap

- Follow-up reminder automation
- Multiple images per listing
- Supabase Auth for true user accounts and permissions
