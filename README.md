# IQ Vote

The internal Employee of the Month voting platform for [IQ Wiki](https://iq.wiki) / BrainDAO.

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
- **Light & dark mode** — theme toggle in the header
- **Historical data import** — bulk import past leaderboard data
- **Export** — export leaderboard data to XLSX
- **Responsive** — works on desktop, tablet, and mobile

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: Tailwind CSS, Radix UI, Lucide React, Recharts
- **Backend**: Supabase (auth, database, storage)
- **Deployment**: Vercel

## Running the App

```bash
npm i
npm run dev
```

### Build for Production

```bash
npm run build
```

## User Roles

| Feature | Team Member | Admin |
|---------|-------------|-------|
| Vote | Yes (if eligible) | Yes |
| View leaderboard | Yes | Yes |
| View vote history | Yes | Yes |
| Manage team members | No | Yes |
| Create elections | No | Yes |
| Set eligibility | No | Yes |
| Promote admins | No | Yes |
