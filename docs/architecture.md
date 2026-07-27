# Architecture

## Voters and candidates are separate

This is the single most important thing to understand about IQ Vote, and the
easiest to get wrong.

| | Voters | Candidates |
|---|---|---|
| Stored as | `user:{id}` | `employee:{id}` |
| Created by | Signing up | An admin, via Admin → Employees |
| Can cast a vote | Yes | Only if they also have a `user:` record |
| Can receive votes | No | Yes — these are the people on the ballot |

Signing up creates a **voter only**. It does not put you on the ballot. This is
deliberate: executives and managers need to vote without appearing as
candidates.

Consequences worth remembering:

- **Admins can vote.** Being an admin has never prevented anyone from casting a
  ballot. If someone believes otherwise, they are confusing *eligibility to
  receive votes* with *permission to vote*.
- **Admin checks read `user:{id}`**, not `employee:{id}`, so an admin does not
  need to be a candidate.
- **The first person to sign up** is granted `is_admin: true` automatically.
- **The super admin** is identified by email (`ajayifey@gmail.com`) *and*
  `is_admin: true` — see `isSuperAdmin()` in the server. Only they can reset the
  database once users exist.

### "Still to vote" means candidates, not all voters

The turnout list in Admin → Votes, and the reminder that sends from it, are
scoped to the election's `eligible_employees` — the people **on the ballot**.
Someone who holds an account and could vote, but isn't standing as a candidate,
does not appear there and is never sent a reminder.

This is intended, and confirmed by the builder. Do not "fix" it by widening the
list to every account holder. If you widen it, the count under the heading stops
matching the ballot it is counting against, and the admin blast on the Elections
tab — which does write to everyone — loses its reason to be a separate thing.

The reminder endpoint recomputes this set server-side on every request and mails
only within it, so a stale client list can never reach someone who has since
voted, and the endpoint cannot be pointed at arbitrary addresses. That guarantee
lives in `getElectionNonVoters()`; keep it there if you touch this.

## Storage

Everything lives in one Supabase table, `kv_store_e2c9f810` (`key TEXT PRIMARY
KEY`, `value JSONB`), accessed through `src/supabase/functions/server/kv_store.tsx`.

| Prefix | Key shape | Holds |
|---|---|---|
| `user:` | `user:{userId}` | Voter profile, `is_admin` flag |
| `employee:` | `employee:{employeeId}` | Candidate profile |
| `election:` | `election:{electionId}` | Election window, timezone, eligible candidates |
| `ballot:` | `ballot:{electionId}:{userId}` | One submitted ballot |
| `tally:` | `tally:{electionId}:{employeeId}` | Running score for a candidate |
| `audit:` | `audit:{auditId}` | Admin action log |

Election IDs are `crypto.randomUUID()` — hex and hyphens only, never a colon.
That is what makes `key.split(':')` safe for parsing composite keys.

### Why tallies are stored, not computed

Scores are incremented at submission time rather than recalculated by scanning
ballots. Leaderboard reads stay cheap, and — because ballots are final — a
stored tally can't drift from its ballots.

## Query patterns

`getByPrefix(prefix)` fetches a whole namespace in one round-trip.
`getByPrefixWithKeys(prefix)` does the same but keeps each key alongside its
value, so callers can group in memory.

Use the latter whenever you need per-entity data across many entities. The
endpoints that aggregate across elections (`/leaderboard/aggregated`,
`/admin/export/all-data`, `/my-received-votes`) fetch `tally:` once and group by
splitting the key, rather than issuing one query per election. Reintroducing a
per-id query inside a loop is the main way this app gets slow.

## Frontend

React + Vite + Tailwind v4. Design tokens live in `src/index.css` under
`@theme` and `.dark`. The app has real light and dark themes on the IQ.wiki
token set: `ThemeProvider` resolves a stored `light` / `dark` / `system`
preference and applies `.dark` to `<html>`, and an inline script in
`index.html` paints the saved choice before first render so there is no flash.

`App.tsx` owns auth and the top-level data fetch. Two flags gate the shell:
`loading` (auth resolved) and `dataReady` (first data fetch settled). Both must
clear before any page renders — otherwise an empty `currentElection` renders as
"no election exists" while the fetch is still in flight.
