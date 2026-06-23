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

# Set up environment variables
cp .env.example .env.local
# Fill in your Supabase URL, anon key, and Brevo API key

# Run the development server
npm run dev
```

## Tech Stack

- **Framework** — Next.js (App Router)
- **Database** — Supabase (PostgreSQL)
- **Email** — Brevo (transactional emails)
- **Hosting** — Vercel

## License

All Rights Reserved. Internal use only.
