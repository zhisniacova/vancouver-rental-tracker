# Vancouver Rental Tracker

Deployed Site: [rental-search-tracker.vercel.app](https://rental-search-tracker.vercel.app/)

A full-stack web application that transforms apartment hunting from a chaotic, fragmented process into a structured, collaborative workflow.

Designed for real users actively searching in Vancouver, the app centralizes listings, communication, and decision-making into a single system.

## Overview

Rental searching often involves:

- dozens of open tabs
- lost conversations with landlords
- missed follow-ups
- unclear prioritization between options

This application solves that by acting as a workflow management system for apartment hunting, enabling users to track, evaluate, and coordinate listings efficiently.

It is being actively used by multiple users collaborating in real-time during a live apartment search!

## Core Features

### Listing Management
- Create, edit, and track listings with lifecycle states:
  - `New -> Messaged -> Viewing Scheduled -> Viewed -> Expired`
- Image suport (URL + uploaded cover images)
- Duplicate detection across listings

### Smart Dashboard
- Multi-select filters (neighborhoods, status)
- Sorting by price, score, and status
- Live result counts (“Showing X of Y listings”)
- **Top Picks** bar for mutually liked listings
- **Needs Action** panel highlighting:
  - Listings to review
  - Listings to message
  - Duplicates

### Real-Time Collaboration
- Multi-user system supporting concurrent usage across sessions
- Changes made by one user (e.g., scoring, messaging, status updates) are **immediately reflected for other users**
- Shared state across:
  - listings
  - scores and likes
  - messages and communication history
  - viewing schedules
- Designed for roommate workflows where multiple users coordinate decisions in parallel

### Scoring & Prioritization
- Per-user scoring system
- Auto-like when score > 5
- "Top Picks" based on shared interest
- NEW badge for recently added listings

### Messaging system
- Built-in message composer (Email / SMS / Website)
- Editable templates with clipboard support
- Auto-tracking of:
  - `messaged_at`
  - `messaged_by`
  - status updates
- Message history timeline per listing

### Viewing Scheduler
- Dedicated `/viewings` page
- Grouped by date
- Split into:
  - Upcoming
  - Past
- Timezone-safe handling (Vancouver)

### Action-oriented Workflow
- “Needs Action” navigation system
- Step-through flow using Next **Needs Action** →
- Designed to reduce decision fatigue and missed steps

### Data & System Design
- Dynamic neighborhoods (user-created options)
- Listing health check API (detect expired listings)
- Normalized relational data model:
  - listings
  - listing_likes
  - listing_messages
  - neighborhoods

## Tech Stack

- **Frontend**: Next.js (App Router), React 19, TypeScript
- **Backend**: Supabase (PostgreSQL + Storage)
- **Styling**: Tailwind CSS
- **Tooling**: ESLint

## Architecture

```
app/
  Dashboard, listing details, messaging, viewings (server-rendered)

components/
  Reusable UI (ListingCard, FilterBar, MessageComposer, etc.)

lib/
  Supabase client + utilities

api/
  /api/check-listing → validates listing availability
```

## Key Product Decisions
- No authentication initially
  - → prioritized rapid iteration and real usage testing
- Explicit statuses + timestamps
  - → ensures workflow state is always visible
- Action-driven UI (Top Picks + Needs Action)
  - → reduces cognitive overload vs raw listing lists
- Server-rendered data fetching
  - → simple, reliable data consistency


## Local Development


```bash
npm install
```

Create `.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Run:

```bash
npm run dev
```

Open `http://localhost:3000`.


## Resume Highlights

- Designed and built a full-stack workflow application with real multi-user coordination constraints
- Implemented end-to-end messaging system with persistent state transitions and audit history
- Developed prioritization logic (scoring, shared likes, action detection) to convert unstructured data into actionable insights
- Modeled and integrated relational database schema to support evolving product features


## Future Improvements
- Follow-up reminder automation
- Multi-image support per listing
- User authentication (Supabase Auth)