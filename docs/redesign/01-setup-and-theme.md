# 01 — Safe Setup, Theme Foundation & Audit

> Feed FIRST, after placing 00-CLAUDE.md as CLAUDE.md at the repo root.
> Goal: set up a safe working branch, wire the IQ.wiki theme tokens, and audit the
> app WITHOUT changing any data or logic. STOP at the gate.

## Core idea
Establish a safe redesign environment and the shared theme foundation. No visual
overhaul yet — just make it safe to work and get the design system in place.

## Safety first (do this before anything)
1. Confirm the stack and read the codebase to understand how screens read from
   Supabase. DO NOT modify any query, schema, or logic.
2. Create a new git branch (e.g. `redesign/iqwiki-theme`). All work happens here.
3. Confirm Vercel gives a PREVIEW deploy for this branch. We review there, never
   on production, while a vote may be live.
4. Produce a short audit: list the screens/components, note which are styled ad-hoc
   vs. token-based, and flag the sign-in/sign-up page + the create-election and
   cast-vote flows as the redesign targets. WAIT for approval on the audit.

## Theme foundation
5. Wire the IQ.wiki tokens from THEME-tokens.css as the global theme (light :root
   + dark .dark), including the full `@theme inline` mapping so Tailwind utilities
   resolve to these variables. Keep the builder's exact values.
6. Ensure a working light/dark toggle (retry light mode properly this time).
   Persist the user's choice; respect system preference as default.
7. Replace hard-coded colors in shared primitives (buttons, inputs, cards,
   dialogs) with the token variables — styling only, no behavior change.

## Premium primitives (the foundation of the whole feel)
8. Establish the PREMIUM component language up front, since every later screen
   reuses it:
   - A consistent, cohesive **rounded-corner radius** across buttons, inputs,
     cards, modals, and nav (you may raise the token radius if it reads more
     premium — apply it consistently everywhere).
   - A **rounded, floating nav bar** as the app's signature element (the builder
     likes this). Themed, subtle shadow, clear active state in pink.
   - Polished button/input/card/dialog/toast primitives with real hover, press,
     and focus states + subtle transitions (respect prefers-reduced-motion).
   - Reusable **skeleton/loading** and **empty-state** patterns for later screens.
   Show these primitives in a small demo so the language is locked before screens.

## Constraints
- UI/styling only. No DB, schema, Supabase query, auth, or vote-logic changes.
- No new deps unless justified + free. Keep all existing data hooks intact.

## Negative prompt
No production pushes during a live vote. No schema/migration/logic edits. No new
color identity — use the tokens. No removing light mode.

## Success
- A safe branch + preview deploy exists.
- The IQ.wiki tokens drive the whole app; both themes work via a toggle.
- Shared components read from tokens; nothing about data/logic changed.
- An audit lists exactly what each later file will restyle.

## Approval gate
STOP. Show the audit + the themed shared components on the preview URL, in both
light and dark. Wait for approval before 02.
