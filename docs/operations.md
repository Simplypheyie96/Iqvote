# Operations

## Resetting the database

> **This permanently deletes every user, candidate, election, ballot and tally.**
> It cannot be undone. If an election is currently open, resetting destroys
> votes people have already cast. Check the Elections tab before you run it.

The endpoint is `POST /make-server-e2c9f810/admin/reset-database`, guarded as
follows:

| State | Who can reset |
|---|---|
| No users exist yet | Anyone — this is the initial-setup path |
| Any user exists | Only the super admin (`ajayifey@gmail.com`, with `is_admin: true`) |

Requests without a valid session get a 401; a signed-in non-owner gets a 403.
The call must send the **user's access token**, not the public anon key — using
the anon key is why early reset attempts failed.

### How to run it

Signed in as the owner, use Admin → Danger Zone in the app. That path handles
the token correctly and confirms before firing.

There are also standalone pages in `src/` (`reset.html`, `quick-reset.html`,
`grant-admin.html`) left over from initial setup. They are **not** part of the
build and never ship to production — they only work if opened locally against
the deployed function.

### After a reset

The first person to sign up becomes admin again. Re-add candidates and recreate
the election; none of it is restored automatically.

## Deploying

**Frontend** — Vercel builds from `main` automatically. Pull requests get
preview deployments.

**Edge Function** — *not* covered by the Vercel build. Deploy separately:

```bash
npm run deploy:server
```

Anything under `src/supabase/functions/server/` — new endpoints, query
optimisations, bug fixes — stays inert in production until this is run. If the
app is behaving like an older version of the server, this is the first thing to
check.

Merging to `main` does **not** deploy the server. There is no hook. Nothing will
warn you. If your change touched anything under `src/supabase/functions/server/`,
running this is part of shipping it.

> Do not call `supabase functions deploy` directly from the repo root. The CLI
> looks for `supabase/functions/make-server-e2c9f810/index.ts`, and this repo
> keeps the server at `src/supabase/functions/server/index.tsx`, so the command
> fails with "no such file or directory". That mismatch went unnoticed for four
> months, during which every server change sat undeployed while `main` moved on.
> `npm run deploy:server` stages the source into the layout the CLI expects,
> deploys, and then checks the function still answers.

### Verifying a server deploy

The function is one unit — deploying your change also deploys every server
commit merged since the last deploy. Before shipping, check what is riding
along:

```bash
git log --oneline <last-deployed-sha>..HEAD -- src/supabase/functions/server/
```

If any of it touches the leaderboard or tally paths, snapshot the numbers first
and compare after — the API is readable with the public anon key:

```bash
BASE=https://xgecjoivqzmqrgffchnn.supabase.co/functions/v1/make-server-e2c9f810
KEY=$(grep -oE 'publicAnonKey = "[^"]+' src/utils/supabase/info.tsx | cut -d'"' -f2)
curl -s -H "Authorization: Bearer $KEY" "$BASE/leaderboard/aggregated"
```

A new endpoint is live when it returns **401** rather than 404 — 404 means the
route isn't there and the deploy didn't take.

## Changing things while an election is live

Frontend-only changes are safe to ship mid-election; they don't touch stored
ballots. Before merging anything that reaches the server, confirm the diff
contains no changes to `kv.set` / `kv.del` call sites on the ballot and tally
paths, and no change to the request or response shape of `/vote`.
