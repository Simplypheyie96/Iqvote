#!/usr/bin/env bash
#
# Deploy the Supabase Edge Function.
#
# The Supabase CLI insists on finding a function at
# `supabase/functions/<slug>/index.ts` relative to the working directory. This
# repo keeps the server at `src/supabase/functions/server/index.tsx` — a Figma
# Make export layout that predates the CLI ever being used here. So the
# documented `supabase functions deploy` command has never worked from the repo
# root; it fails with "no such file or directory" and the deploy silently never
# happens. That is how production ended up running four-month-old server code
# while `main` moved on.
#
# Rather than duplicate the source into a second location that would drift, this
# stages the real source into the layout the CLI wants and deploys from there.
# src/ stays the single source of truth.
#
# Usage:  npm run deploy:server

set -euo pipefail

PROJECT_REF="xgecjoivqzmqrgffchnn"
SLUG="make-server-e2c9f810"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$REPO_ROOT/src/supabase/functions/server"

for f in index.tsx kv_store.tsx; do
  [ -f "$SRC/$f" ] || { echo "error: missing $SRC/$f" >&2; exit 1; }
done

STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
mkdir -p "$STAGE/supabase/functions/$SLUG"

# index.tsx -> index.ts: the deployed entrypoint is .ts, and the CLI matches on
# that exact name. The contents are identical; only the extension changes.
cp "$SRC/index.tsx"    "$STAGE/supabase/functions/$SLUG/index.ts"
cp "$SRC/kv_store.tsx" "$STAGE/supabase/functions/$SLUG/kv_store.tsx"

echo "Deploying $SLUG to $PROJECT_REF …"
( cd "$STAGE" && supabase functions deploy "$SLUG" --project-ref "$PROJECT_REF" )

# A deploy that reports success can still have shipped a function that throws on
# boot, so confirm the thing actually answers before calling this done.
BASE="https://$PROJECT_REF.supabase.co/functions/v1/$SLUG"
ANON="$(grep -oE 'publicAnonKey = "[^"]+' "$REPO_ROOT/src/utils/supabase/info.tsx" | cut -d'"' -f2)"

echo "Checking the deployed function responds …"
code="$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $ANON" "$BASE/elections")"
if [ "$code" = "200" ]; then
  echo "OK — GET /elections returned 200."
else
  echo "WARNING: GET /elections returned $code, expected 200." >&2
  echo "Roll back at https://supabase.com/dashboard/project/$PROJECT_REF/functions" >&2
  exit 1
fi
