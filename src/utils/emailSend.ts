/* Reading the outcome of a Brevo send.

   Two screens now ask the server to send mail — Elections ("Remind everyone")
   and Votes ("Remind the ones still to vote") — and both get the same shape
   back. They should therefore reach the same verdict about it. Left as a copy
   in each file, a partial failure could read as a warning on one screen and a
   success on the other, which is the exact bug the elections screen was fixed
   for. One reader, one verdict. */

export interface SendOutcome {
  tone: 'success' | 'warning' | 'error';
  title: string;
  cause?: string;
  fix?: string;
  fixHref?: string;
  fixLabel?: string;
  detail?: string;
}

/* What the server hands back from any of the send endpoints. */
export interface SendResponse {
  sent?: number;
  total?: number;
  errors?: string[];
  skipped?: boolean;
}

/* Brevo repeats the same sentence once per recipient, prefixed with who it was
   for. Sixteen identical paragraphs is not sixteen pieces of information — fold
   them down to the distinct complaints and say how many people each one hit. */
export function summariseFailures(failures: string[]): string {
  const counts = new Map<string, number>();
  for (const failure of failures) {
    const message = failure.replace(/^\S+@\S+\s*\(via[^)]*\)\s*:\s*/, '').trim() || failure;
    counts.set(message, (counts.get(message) || 0) + 1);
  }

  const distinct = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const shown = distinct.slice(0, 2).map(([message, n]) => {
    const clipped = message.length > 260 ? `${message.slice(0, 260)}…` : message;
    return `“${clipped}” (${n} ${n === 1 ? 'recipient' : 'recipients'})`;
  });

  if (distinct.length > shown.length) {
    shown.push(`and ${distinct.length - shown.length} other ${distinct.length - shown.length === 1 ? 'error' : 'errors'}`);
  }
  return shown.join(' · ');
}

/* Brevo answers with one message per recipient, and those messages say very
   different things — a blocked IP is not an unverified sender is not a rate
   limit. This used to print the same guess over all of them ("check that both
   sender emails are verified"), which sends you off to inspect the one thing
   that usually isn't wrong. Read what Brevo actually said instead. */
export function diagnoseSendFailure(
  failures: string[]
): Pick<SendOutcome, 'cause' | 'fix' | 'fixHref' | 'fixLabel'> {
  const all = failures.join(' ').toLowerCase();

  if (all.includes('unrecognised ip') || all.includes('unrecognized ip') || all.includes('authorised_ips')) {
    return {
      cause: 'Brevo refused the API key because the call came from an IP address it does not recognise — the Authorised IPs security setting is switched on.',
      fix: 'Switch that setting off in Brevo. Adding the address from the message below only holds until it changes, and it changes constantly: the server runs on Supabase Edge Functions, which have no fixed outbound IP.',
      fixHref: 'https://app.brevo.com/security/authorised_ips',
      fixLabel: 'Open Authorised IPs in Brevo',
    };
  }

  if (all.includes('sender') && (all.includes('not valid') || all.includes('not verified') || all.includes('unknown'))) {
    return {
      cause: 'Brevo rejected the address the mail was sent from.',
      fix: 'Every address in BREVO_FROM_EMAIL has to be verified as a sender in Brevo before it can send.',
      fixHref: 'https://app.brevo.com/senders/list',
      fixLabel: 'Open Senders in Brevo',
    };
  }

  if (all.includes('rate limit') || all.includes('too many') || all.includes('429') || all.includes('credit')) {
    return {
      cause: 'Brevo throttled the account, or the sending plan ran out of credits.',
      fix: 'Check the plan and daily limit, then send again — the ones that already went out will simply arrive twice for those people.',
      fixHref: 'https://app.brevo.com/billing/plan',
      fixLabel: 'Open the plan in Brevo',
    };
  }

  if (all.includes('key not found') || all.includes('unauthorized') || all.includes('api key')) {
    return {
      cause: 'Brevo did not accept the API key at all.',
      fix: 'Check BREVO_API_KEY on the Supabase Edge Function — a revoked or mistyped key looks exactly like this.',
    };
  }

  return {
    cause: 'Brevo rejected these sends and the reason is in its own words below.',
    fix: 'If the wording is unfamiliar, the Brevo dashboard logs the same failures with more context.',
    fixHref: 'https://app.brevo.com/log',
    fixLabel: 'Open the Brevo email log',
  };
}

/* `audience` names who the mail went to, so the success line can be specific:
   "sent to all 6 people who still had to vote" rather than a bare count that
   leaves you wondering which 6. */
export function describeSendResult(
  result: SendResponse,
  { audience }: { audience?: string } = {}
): SendOutcome {
  if (result.skipped) {
    return {
      tone: 'error',
      title: 'Email is not configured, so nothing was sent.',
      cause: 'The server has no Brevo API key or no sender address, so it never attempted a send.',
      fix: 'Set BREVO_API_KEY and BREVO_FROM_EMAIL on the Supabase Edge Function, then redeploy it.',
    };
  }

  const sent = result.sent ?? 0;
  const failures = result.errors || [];
  const total = result.total ?? sent;

  /* Nobody to write to is not a success and not a failure — it's a no-op, and
     saying "sent to all 0 people" would be a strange way to put it. */
  if (total === 0) {
    return {
      tone: 'warning',
      title: 'Nobody to send to, so no email went out.',
      cause: audience
        ? `Nobody matched ${audience}.`
        : 'There were no recipients for this send.',
    };
  }

  if (failures.length === 0) {
    const who = sent === 1 ? 'person' : 'people';
    return {
      tone: 'success',
      title: `Reminder sent to all ${sent} ${who}${audience ? ` ${audience}` : ''}.`,
    };
  }

  /* Nothing arriving is a failure, not a success with a footnote. */
  return {
    tone: sent === 0 ? 'error' : 'warning',
    title: sent === 0
      ? `None of the ${total} reminders went out.`
      : `${sent} of ${total} reminders went out. ${failures.length} failed.`,
    ...diagnoseSendFailure(failures),
    detail: summariseFailures(failures),
  };
}
