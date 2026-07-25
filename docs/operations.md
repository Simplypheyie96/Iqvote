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
npx supabase functions deploy make-server-e2c9f810 --project-ref xgecjoivqzmqrgffchnn
```

Anything under `src/supabase/functions/server/` — new endpoints, query
optimisations, bug fixes — stays inert in production until this is run. If the
app is behaving like an older version of the server, this is the first thing to
check.

## Changing things while an election is live

Frontend-only changes are safe to ship mid-election; they don't touch stored
ballots. Before merging anything that reaches the server, confirm the diff
contains no changes to `kv.set` / `kv.del` call sites on the ballot and tally
paths, and no change to the request or response shape of `/vote`.
