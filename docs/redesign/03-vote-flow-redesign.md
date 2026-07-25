# 03 — Redesign: Cast-a-Vote Flow (member)

> Feed after 02. Make voting effortless and satisfying. UI/interaction only —
> the scoring, one-vote rule, and Supabase writes stay EXACTLY as they are.

## Core idea
Casting a vote should be obvious, quick, and pleasant: pick 3 different colleagues,
rank them 1st/2nd/3rd (5/3/2 pts), optionally add an anonymous reason, submit once.
The current flow works; make it clearer and more modern without changing the rules.

## What to change (UI only)
- Restyle the vote screen with IQ.wiki tokens: clear candidate cards, obvious
  selection state (pink accent for chosen), and an unmistakable 1st/2nd/3rd
  ranking interaction (e.g. numbered slots or drag/tap-to-rank — whichever is
  simplest and clearest).
- Show the points mapping plainly (1st = 5, 2nd = 3, 3rd = 2) so voters understand.
- Enforce "3 different candidates" and "one vote, cannot change" in the UI with
  clear affordances + a confirm step — but do NOT change the underlying rule logic;
  mirror what the backend already enforces.
- Optional reason field, clearly marked optional + "shown anonymously".
- Warm, clear success state after submitting. Handle already-voted and
  voting-closed states gracefully (restyle existing states; don't invent logic).
- Both themes, accessible, mobile-friendly (this is likely used on phones).

## Constraints
- DO NOT change vote scoring, the one-vote-per-election rule, eligibility checks,
  or the Supabase write. Restyle and clarify the existing flow only.
- If the current flow's steps are confusing, you may re-order/regroup the UI, but
  the data submitted must be identical.

## Negative prompt
No changes to scoring/eligibility/one-vote logic or DB writes. No allowing a 4th
pick or duplicate picks. No removing the confirm step. No off-brand styling.

## Success
A member can vote in a few clear taps; ranking is obvious; rules are visible;
submission behaves exactly as before; looks on-brand in both themes.

## Gate
STOP. Review on preview (both themes, mobile). Test with a NON-live/test election
if possible so the real vote is untouched. Approve before 04.
