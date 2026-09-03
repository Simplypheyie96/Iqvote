/* Keeps the Supabase project awake.

   Supabase's free tier pauses a project after ~7 days without activity, and a
   paused project's API hostname stops resolving entirely — which would take
   every election, ballot and leaderboard down at once. Any query counts as
   activity, so a daily touch resets the clock. The cron schedule lives in
   vercel.json.

   Two probes run, because either one alone would lie:
   - The REST count proves Postgres itself answered. Under RLS the anon key sees
     zero rows, so only the status code carries information here, not the count.
   - The edge function proves the path the app actually depends on (Deno
     function -> service role -> kv_store) still works, and it returns a real
     election count, so a silent breakage can't pass itself off as healthy.

   If CRON_SECRET is set in the project's env, only Vercel's cron (which sends
   it as a bearer token) may call this; without it the endpoint is open, which
   is acceptable because it reveals nothing and touches nothing. */

/* The same public values as src/utils/supabase/info.tsx. The anon key already
   ships inside the client bundle, so it is not a secret. Env vars win when set,
   which is the way to move this if the Supabase project is ever recreated. */
const PROJECT_ID = 'xgecjoivqzmqrgffchnn';
const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZWNqb2l2cXptcXJnZmZjaG5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwMjI4OTksImV4cCI6MjA3ODU5ODg5OX0.MU7h5NgGFA77C_6TJGldPZpfvLfILr8tMgtMiDlNo_c';

const KV_TABLE = 'kv_store_e2c9f810';
const EDGE_FN = 'make-server-e2c9f810';
const TIMEOUT_MS = 10_000;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

export async function GET(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return json(401, { error: 'unauthorized' });
  }

  const base = (process.env.SUPABASE_URL?.trim() || `https://${PROJECT_ID}.supabase.co`)
    .replace(/\/+$/, '')
    .replace(/\/rest\/v1$/, '');
  const key = process.env.SUPABASE_ANON_KEY?.trim() || ANON_KEY;

  /* Both probes touch the database, so either one on its own is enough to reset
     the pause clock. They run together so one hanging host can't cost twice the
     wait, and the timeout keeps a stalled connection from eating the function's
     whole duration budget. */
  const [rest, edge] = await Promise.allSettled([
    fetch(`${base}/rest/v1/${KV_TABLE}?select=key`, {
      method: 'HEAD',
      headers: {
        apikey: key,
        authorization: `Bearer ${key}`,
        prefer: 'count=exact',
        range: '0-0',
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    }),
    fetch(`${base}/functions/v1/${EDGE_FN}/elections`, {
      headers: { authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    }),
  ]);

  const restOk = rest.status === 'fulfilled' && rest.value.ok;
  const edgeOk = edge.status === 'fulfilled' && edge.value.ok;

  /* Count the elections the edge function returned. A shape change here is not
     a failure — the point of the probe is that the request completed — so an
     unexpected body just leaves the count null rather than tripping an alarm. */
  let elections: number | null = null;
  if (edgeOk && edge.status === 'fulfilled') {
    try {
      const body = (await edge.value.json()) as { elections?: unknown };
      if (Array.isArray(body?.elections)) elections = body.elections.length;
    } catch {
      /* not JSON; the status code already told us what we needed */
    }
  }

  /* On a rejection the reason matters more than the fact: a paused project fails
     DNS ('fetch failed' / ENOTFOUND) while a wedged one times out, and those
     want different responses from whoever reads the log. */
  const detail = (r: PromiseSettledResult<Response>): string | number => {
    if (r.status === 'fulfilled') return r.value.status;
    const { name, message } = (r.reason ?? {}) as { name?: string; message?: string };
    return [name, message].filter(Boolean).join(': ') || String(r.reason);
  };

  /* A failure here is the early warning a broken page never gives you: it means
     the project is paused (or the keys rotted) BEFORE anyone tries to vote. The
     non-200 makes the cron run show as failed in the Vercel dashboard. */
  if (!restOk || !edgeOk) {
    console.error(
      `[keepalive] supabase unhealthy — rest: ${detail(rest)}, edge: ${detail(edge)}`,
    );
    return json(502, {
      error: 'supabase-unhealthy',
      rest: detail(rest),
      edge: detail(edge),
    });
  }

  console.log(`[keepalive] ok, ${elections ?? 'unknown'} elections visible`);
  return json(200, { ok: true, elections });
}
