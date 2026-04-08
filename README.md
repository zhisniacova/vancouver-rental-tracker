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

- Listing lifecycle management: create, edit, delete, and status updates (`New`, `Messaged`, `Viewing Scheduled`, `Viewed`, `Expired`)
- Smart dashboard UX:
  - search + polished multi-select filters for neighborhoods and statuses
  - sorting by price, score, and status (both `New → Viewed` and `Viewed → New`)
  - "Showing X of Y listings" live result count
  - compact horizontal "Top Picks" bar for mutually liked, high-score listings
  - user-specific "Needs Action" bar with tags:
    - `Review` (you still need to score the other person’s listing)
    - `Message Soon` (both liked, not messaged yet)
    - `Duplicate` (same URL detected across listings)
- Needs Action workflow navigation:
  - open a listing from Needs Action and move through the queue using `Next Needs Action →`
- Dual-user collaboration model (no auth yet):
  - user context switcher (`Sasha` / `Gleb`)
  - persisted local preference via `localStorage`
- Scoring and likes workflow:
  - score editing on dashboard cards and in listing details (`Quick scoring` panel)
  - auto-like when a user score is greater than 5
  - `NEW` image badge for listings added in last 24h (hidden once both users scored)
- Messaging workflow:
  - templated Email / Website Message / SMS drafts
  - fully editable message body in-app (`Message Editor`)
  - auto-CC the other user for email drafts
  - rich clipboard copy with clickable links when pasted into Gmail
  - message history persisted in `listing_messages`
  - auto-updates `messaged_at`, `messaged_by`, and listing status
- Message timeline tracking:
  - append rental replies and follow-ups directly from listing details
  - reverse-chronological history for faster recent-context access
- Viewing scheduler page (`/viewings`):
  - grouped by day
  - separated into upcoming vs past sections
  - timezone-safe Vancouver-time classification for upcoming/past accuracy
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
  - reusable UI and feature components (`ListingCard`, `ListingForm`, `FilterBar`, `MessageComposer`, `MessageHistory`, `ListingScorePanel`, `NeedsActionNavigator`)
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
- Built prioritization logic (shared likes + scoring + duplicate detection + action tags) to convert noisy data into actionable decisions.
- Modeled and integrated normalized relational tables in Supabase to support evolving product features.

## Next Roadmap

- Follow-up reminder automation
- Multiple images per listing
- Supabase Auth for true user accounts and permissions
