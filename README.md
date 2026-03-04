# IQ Vote

A modern Employee of the Month voting platform built with React, TypeScript, and Supabase.

## Overview

IQ Vote lets teams run transparent, structured internal elections. Admins manage employees and elections; employees cast ranked votes; everyone views results on a live leaderboard.

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
- **Vote history** — employees can review their past votes
- **Admin panel** — manage employees, elections, and eligibility (admin-only)
- **Role-based access** — first user auto-becomes admin; admins can promote others
- **Light & dark mode** — theme toggle in the header
- **Historical data import** — bulk import past leaderboard data
- **Export** — export leaderboard data to XLSX
- **Responsive** — works on desktop, tablet, and mobile

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: Tailwind CSS, Radix UI, Lucide React, Recharts
- **Backend**: Supabase (auth, database, storage)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### Install & Run

```bash
npm i
npm run dev
```

### Build for Production

```bash
npm run build
```

## First-Time Setup

1. Sign up — the **first user automatically becomes admin**
2. In the **Admin** tab, add your employees under **Employees**
3. Create an election under **Elections** (set name and date range)
4. Go to **Eligibility**, select the election, and check who can vote and who can be voted for
5. Share the app URL with your team — employees sign up with the exact email the admin added

## Environment Variables

Create a `.env` file at the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## User Roles

| Feature | Employee | Admin |
|---------|----------|-------|
| Vote | Yes (if eligible) | Yes |
| View leaderboard | Yes | Yes |
| View vote history | Yes | Yes |
| Manage employees | No | Yes |
| Create elections | No | Yes |
| Set eligibility | No | Yes |
| Promote admins | No | Yes |
