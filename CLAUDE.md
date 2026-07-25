# IQ Vote — Redesign Instructions (CLAUDE.md)

> Save at repo root as `CLAUDE.md`. Standing brief for the redesign. The numbered
> files (01–05) are the step-by-step plan, fed one at a time.

## What IQ Vote is
IQ Vote is the internal Employee-of-the-Month voting platform for IQ.wiki /
BrainDAO. Team members cast ranked votes (1st = 5 pts, 2nd = 3 pts, 3rd = 2 pts;
3 different candidates; one vote per election, not changeable; optional anonymous
reason). Features: elections management, eligibility control, live leaderboard
(all-time / year / month + top-3 podium), vote history, admin panel, role-based
access, Brevo email notifications, Supabase backend.

Tech stack (do NOT change): Vite + React + TypeScript, Tailwind (v4), Supabase
(PostgreSQL), Brevo email, Vercel hosting.

## THIS IS A VISUAL REDESIGN ONLY — critical rules
The app is LIVE and a real vote may be running against a real Supabase database.
- **DO NOT** change the database, schema, tables, RLS policies, or any Supabase
  queries. Do not run migrations. Do not touch vote-counting or scoring logic.
- **DO NOT** change auth logic, election logic, eligibility logic, or email logic.
- **ONLY** change presentation: styling, layout, components, theme, spacing,
  copy/microcopy, and front-end interaction polish.
- If a visual change *seems* to need a data/logic change, STOP and ask first.
- **Work on a separate git branch + Vercel preview deploy.** Never push styling
  changes straight to production while a vote is live. Verify on the preview URL
  against real data, then merge only when approved.
- Before starting, confirm: does the current UI read from the DB in a way that a
  styling refactor could break? Keep all data hooks/queries intact; only restyle
  what they render.

## The north star — a PREMIUM, modern app end to end
The goal is not just "look like IQ.wiki." The goal is that IQ Vote FEELS like a
premium, modern, considered product on EVERY surface — the first page, auth, the
vote flow, the admin panel, the deepest settings, and the smallest modal. No rough
edges anywhere. Judge every screen by: "does this feel like an expensive, polished
app?" If any screen feels basic or inconsistent, it's not done.

What "premium" means here (apply everywhere):
- Consistent **rounded corners** across cards, buttons, inputs, modals, nav — a
  deliberate, cohesive radius language (the builder likes the rounded look).
- A **rounded, floating nav bar** as a signature element (the builder likes it).
- Smooth, subtle **micro-interactions**: hover, press, focus, transitions between
  states — tasteful, never flashy. Respect prefers-reduced-motion.
- Thoughtful **empty, loading, and error states** on every screen (skeletons, not
  jarring spinners where possible). No dead ends.
- Proper **spacing rhythm and hierarchy**; generous, calm surfaces.
- Polished **modals/dialogs/toasts** — the small stuff must feel as considered as
  the big stuff.

## Visual identity — IQ.wiki design system
Use the provided IQ.wiki theme tokens (THEME-tokens.css) as the SOURCE OF TRUTH
for color, radius, shadow, and typography. This gives the premium feel a coherent
identity:
- **Primary = IQ.wiki pink/magenta** (`oklch(0.71 0.21 354)` light /
  `oklch(0.65 0.26 0.6)` dark). Accent for primary actions, active states, and the
  vote CTA — used with restraint, not everywhere.
- **Both light and dark themes**, from the token values. A working toggle. (Light
  mode is retried and done properly this time; don't strip it.)
- Card/popover/border/muted/sidebar tokens from the file; use the shadow + radius
  scales (you may increase radius for the rounded look if it reads more premium,
  applied consistently).

## Priorities for this redesign
1. **Premium feel end to end** — every screen, every state, every modal polished
   and consistent (see the north star above). This is the overriding goal.
2. **Apply the IQ.wiki theme** properly across the whole app (tokens → components),
   with the rounded corners + rounded floating nav as signature elements.
3. **Redesign the sign-in / sign-up page** (the builder was unhappy with it).
4. **Make the two core flows effortless:**
   - Creating an election (admin): clear, guided, minimal friction.
   - Casting a vote (member): pick 3 ranked choices (5/3/2), one vote, optional
     anonymous reason — obvious, satisfying ranking interaction.
5. **A real podium leaderboard** — the top 3 should look like an actual physical
   podium (tiered heights: 1st tallest and centered, 2nd and 3rd flanking; rank
   medals/treatment), not three flat cards in a row. Current version is "decent" —
   push it to feel real and celebratory.
6. **Shareable podium image (PM/admin only)** — the PM can export a branded image
   of the top 3 (1st/2nd/3rd) to announce the winner while honoring the runner-up
   and third place. Front-end only; reads existing standings. See file 06.
7. Consistent components, both themes, accessible (AA+ contrast, keyboard, focus).

## Review & merge rule (NON-NEGOTIABLE)
The builder reviews EVERY screen/design and must explicitly approve before ANY
merge to main. Nothing merges to production without sign-off. Work on a branch,
show each step on the Vercel preview, and WAIT for approval at every gate. Never
merge or deploy to main on your own initiative.

## Guardrails (negative prompt)
No database/schema/logic changes. No new dependencies unless justified and free.
No pushing to production during a live vote. No inventing a new color identity —
use the IQ.wiki tokens. No breaking existing data hooks. No inaccessible contrast
(watch the pink on dark). No feature removal without asking.

## Using installed design skills (per screen)
Before restyling each screen, consult `design-skills-cheatsheet.md` in the repo,
NAME the 1–3 skills you'll use with their scope, and wait for my yes. Stack them:
one process skill → the IQ.wiki theme as the ONE look system → scoped technique
skills → a QA skill. Likely picks for this redesign: `redesign-existing-projects`
(the overall upgrade), `better-ui`/`beautiful-shadows`/`better-typography` (premium
polish), `glassmorphism` (floating glass chrome ONLY), `micro-interaction` /
`transitions-dev` (hover/press/state motion, scoped), `accessible-animation`
(reduced-motion), and `web-design-guidelines` + `fixing-accessibility` (QA before
"done"). The IQ.wiki tokens ARE the look system — do NOT stack another look pack on
top. Never change data/logic (visual-only rule still applies).

## Build discipline
Work one numbered file at a time, on a branch, verify on the Vercel preview, stop
at each file's gate for review before continuing.

---
*Drafted with Dia*
