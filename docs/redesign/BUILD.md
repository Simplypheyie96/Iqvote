# BUILD — How Claude Should Run the IQ Vote Redesign

> Feed Claude this folder and say: "Follow BUILD.md." This orchestrates the SAFE
> visual redesign of the LIVE IQ Vote app: branch + preview only, no data/logic
> changes, review at every gate, merge only on my sign-off. Ties together
> CLAUDE.md + THEME-tokens.css + numbered files 01–06 + design-skills-cheatsheet.md
> + REVIEW-CHECKLIST.md.

## The overriding rule (never break this)
IQ Vote is LIVE with a real Supabase database and a vote may be running. This is a
VISUAL redesign ONLY. Do NOT change the database, schema, RLS, auth logic, vote
scoring, eligibility, or email logic. Only styling, layout, components, and
front-end polish. If a visual change seems to need a data/logic change — STOP and
ask. All work on a branch + Vercel PREVIEW; NEVER touch production while a vote is
live; merge only on my explicit sign-off.

## Ground rules (throughout)
- Follow `CLAUDE.md` and use `THEME-tokens.css` as the source of truth.
- Before each screen, consult `design-skills-cheatsheet.md`, NAME the skills +
  scope, and WAIT for my yes. IQ.wiki tokens are the ONE look system — don't stack
  another look pack.
- Premium end to end: rounded corners, floating glass nav, hover/press/focus +
  loading/empty/error states, both themes, AA+ contrast, real podium.
- Use `REVIEW-CHECKLIST.md` as the gate for each PR.

## Step 0 — Safe setup
1. Read the codebase; understand how each screen reads from Supabase. Change NOTHING
   in data/logic.
2. Create a new branch (e.g. `redesign/iqwiki-theme`). All work happens on branches.
3. Confirm Vercel gives a PREVIEW deploy per branch. Review there, never on prod.
4. Keep `THEME-tokens.css`, the numbered files, `design-skills-cheatsheet.md`, and
   `refs/` in the repo.
5. Produce the audit from file 01 (screens list + what each later file restyles).
   WAIT for my approval on the audit before touching styling.

## Branch + PR workflow (throughout)
- Do each numbered file's work on its own branch (`redesign/02-auth`, etc.).
- Open a PR per step. In the description: what was restyled, which skills + scope
  were used, the preview link, and an explicit "NO data/logic changed" confirmation.
- I review the preview + PR against REVIEW-CHECKLIST.md; approve or request changes.
- Merge to main ONLY after my sign-off, ideally when no vote is mid-submission.

## Build sequence (each = its own branch + PR + gate)
1. `01-setup-and-theme.md` — safe branch + preview, wire IQ.wiki tokens (light +
   dark), premium primitives (rounded corners, floating glass nav), the audit.
2. `02-auth-redesign.md` — redesign the sign-in / sign-up page.
3. `03-vote-flow-redesign.md` — make casting a vote effortless (test on a
   NON-live/test election so the real vote is untouched).
4. `04-admin-and-create-election.md` — simplify creating/managing elections.
5. `05-leaderboard-and-polish.md` — real tiered podium + history + consistency/a11y.
6. `06-shareable-podium-image.md` — admin/PM-only branded podium image export
   (front-end only; reads existing standings; no backend changes).

## Per-step checklist (Claude runs this each time)
- [ ] Named the skills + scope from the cheat sheet, got my yes.
- [ ] Restyled visually only — confirmed NO data/schema/logic/auth change.
- [ ] Static look approved → motion → dark → desktop/mobile.
- [ ] Ran QA skills (design-guidelines + accessibility); fixed flags.
- [ ] Opened a PR with preview link + skills + "no data/logic changed"; waited for me.
- [ ] Merged only after sign-off.

## Definition of done (per screen)
Premium in light AND dark, works mobile → desktop, rounded corners + floating glass
nav consistent, real hover/press/focus + loading/empty/error states, AA+ contrast
(watch pink on dark), and it feels like an expensive product. The live vote and its
data are provably untouched.

## Final launch (only after all steps approved)
- Full review across all screens, both themes, mobile + desktop, against the
  checklist.
- Confirm zero data/logic changes; the live vote and history are intact.
- Merge to main and let Vercel deploy — ideally when no vote is mid-submission.

---
*Drafted with Dia*
