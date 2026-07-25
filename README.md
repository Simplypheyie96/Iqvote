# IQ Vote

The internal Employee of the Month voting platform for [IQ Wiki](https://iq.wiki) / [BrainDAO](https://braindao.org/)

> **Note:** This is a private, org-specific tool built exclusively for the BrainDAO team. It is not a general-purpose voting app.

## Overview

IQ Vote powers BrainDAO's internal monthly recognition elections. Team members cast ranked votes for colleagues, and results are surfaced on a live leaderboard with historical filtering.

### Voting System

| Rank | Points |
|------|--------|
| 1st choice | 5 pts |
| 2nd choice | 3 pts |
| 3rd choice | 2 pts |

- Each voter picks 3 different candidates per election
- One vote per election — cannot be changed after submission
- Voting reasons are optional and displayed anonymously on the leaderboard

## Features

- **Elections management** — create elections with custom date ranges
- **Eligibility control** — set who can vote and who can be voted for, per election
- **Live leaderboard** — filter by all-time, year, or month with a top-3 podium view
- **Vote history** — team members can review their past votes
- **Admin panel** — manage team members, elections, and eligibility (admin-only)
- **Role-based access** — admins manage the platform and can promote other admins
- **Email notifications** — Brevo integration sends vote confirmation and result emails
- **Supabase backend** — PostgreSQL database with row-level security

## Quick Start

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Supabase connection details live in `src/utils/supabase/info.tsx`; server-side
secrets are set on the Edge Function, not in a local env file.

## Documentation

| Doc | Covers |
|---|---|
| [docs/setup.md](docs/setup.md) | Standing up an instance, admin and voter guides, local dev |
| [docs/architecture.md](docs/architecture.md) | Voters vs. candidates, storage layout, query patterns |
| [docs/voting-rules.md](docs/voting-rules.md) | Scoring, tiebreaks, the privacy contract |
| [docs/operations.md](docs/operations.md) | Database reset, deploying, shipping during a live election |
| [docs/og-image.md](docs/og-image.md) | Regenerating the social preview image |

## Tech Stack

- **Framework** — React 18 + Vite
- **Styling** — Tailwind CSS v4
- **Backend** — Supabase (Edge Function + Postgres KV store)
- **Email** — Brevo (transactional emails)
- **Hosting** — Vercel (frontend only — the Edge Function deploys separately)

## License

All Rights Reserved. Internal use only.
