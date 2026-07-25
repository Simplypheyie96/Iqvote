# 02 — Redesign: Sign-in / Sign-up

> Feed after 01 is approved. Redesign the auth page the builder was unhappy with.
> Styling + layout only — keep the existing auth LOGIC (Supabase) untouched.

## Core idea
A clean, modern, on-brand sign-in / sign-up page that looks like it belongs to
IQ.wiki. This is a contained, high-impact win — the first thing users see.

## What to change (UI only)
- Restyle the page using the IQ.wiki tokens: calm surface, clear card, the pink
  primary used for the main action only, proper spacing and hierarchy.
- Both light and dark, via the theme toggle.
- Clear IQ Vote / BrainDAO identity (logo/wordmark, a short line of context:
  "Internal Employee-of-the-Month voting for BrainDAO").
- Tidy the form: labeled fields, sensible focus/hover/error states from tokens,
  accessible contrast (watch pink on dark), keyboard + screen-reader friendly.
- Keep whatever auth methods already exist; DO NOT change how auth works, just how
  it looks. If there are separate sign-in vs sign-up states, make switching clear.

## Constraints
- No changes to Supabase auth calls, redirects, session logic, or validation
  rules — restyle the existing behavior only.
- Reuse the themed primitives from 01 (buttons, inputs, card).

## Negative prompt
No new auth provider or flow. No touching auth logic/redirects. No off-brand
colors. No low-contrast pink text. No layout that breaks on mobile.

## Success
The auth page looks modern and clearly IQ.wiki-aligned, works in both themes, is
accessible, and behaves exactly as before functionally.

## Gate
STOP. Review on the preview URL, both themes, desktop + mobile. Approve before 03.
