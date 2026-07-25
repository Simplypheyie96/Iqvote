# Setup and usage

## Setting up a new instance

**1. Create the first account.** Sign up in the app. The first person to sign up
is granted admin rights automatically.

**2. Add the candidates.** Admin → Employees → Add Employee. These are the
people who will appear on ballots. Adding someone here does *not* create an
account for them — they still sign up themselves.

Use the same email address you'll expect them to sign up with, so their account
links to their candidate profile.

**3. Create an election.** Admin → Elections → Create Election. Set a title and
the start/end window.

**4. Set eligibility.** Admin → Eligibility → pick the election, then choose who
can receive votes. Do this for every election — an election without eligibility
set has nobody to vote for.

**5. Share the URL.** People sign up themselves and can vote immediately.

## For voters

- **Vote** — pick three different colleagues for 1st, 2nd and 3rd. Notes are
  optional and anonymous. Submitting is final.
- **Leaderboard** — results, filterable by year, month, or all-time.
- **Profile** — your voting history and any notes you've received.

See [voting-rules.md](./voting-rules.md) for scoring and privacy.

## For admins

The Admin tab (shield icon) is visible only to admins.

| Task | Where |
|---|---|
| Create or close an election | Admin → Elections |
| Add or edit candidates | Admin → Employees |
| Choose who can receive votes | Admin → Eligibility |
| See who has voted | Admin → Votes |
| Grant admin rights | Admin → Employees → edit → Is Admin |
| Export results | Leaderboard → Export |

Admins can see *who* voted and *when*, but never *who they voted for* — see
[voting-rules.md](./voting-rules.md#privacy).

## Local development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
```

The Supabase Edge Function under `src/supabase/functions/server/` is **not**
deployed by the Vercel build — it ships separately:

```bash
npx supabase login
npx supabase functions deploy make-server-e2c9f810 --project-ref xgecjoivqzmqrgffchnn
```

Changes to server code have no effect in production until that runs.
