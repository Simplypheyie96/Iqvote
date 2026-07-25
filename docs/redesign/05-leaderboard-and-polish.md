# 05 — Redesign: Leaderboard, Vote History & Final Polish

> Feed last. Polish the most-seen screen (leaderboard) and vote history, then do a
> consistency + accessibility pass. UI only.

## Core idea
The leaderboard is the payoff screen — make it feel celebratory and clear. Then
tighten everything into one consistent, modern, IQ.wiki-aligned product.

## What to change (UI only)
- **Leaderboard — a REAL podium.** The top 3 should look like an actual physical
  podium, not three flat cards:
  - Tiered heights: 1st place tallest and centered, 2nd to its left (medium), 3rd
    to its right (shortest) — the classic podium silhouette.
  - Clear rank treatment: 1/2/3 with medal or number styling, name, points, and
    (if shown) a hint of their anonymous reason.
  - Use the pink accent + chart tokens tastefully; 1st place gets the strongest
    emphasis. Subtle entrance animation (respect prefers-reduced-motion).
  - Below the podium: a clean ranked list for the rest.
  - Clear all-time / year / month filter, on-brand.
  - Both themes; looks celebratory and premium, works on mobile.
- **Vote history:** a tidy, readable view of a member's past votes, on-brand.
- **Consistency pass:** every screen uses the premium primitives from 01 (rounded
  corners, floating nav, spacing, radius, shadow scales, hover/press/focus states,
  skeleton + empty states). Remove leftover ad-hoc styles. The smallest modal must
  feel as considered as the main screens.
- **Accessibility pass:** AA+ contrast everywhere (especially pink on dark),
  keyboard navigation, visible focus states, prefers-reduced-motion honored.
- **Responsive pass:** verify mobile + desktop for all screens.

## Constraints
- UI/styling only. No changes to how standings are computed, filtered, or fetched
  — restyle the existing leaderboard data. No DB/logic edits.

## Negative prompt
No changes to score computation, filtering logic, or data queries. No off-brand
colors. No inaccessible contrast. No layout that breaks on mobile.

## Success
The leaderboard looks celebratory and clear; history is readable; the whole app is
visually consistent, accessible, and unmistakably IQ.wiki-aligned in both themes —
with zero changes to data, scoring, or the live vote.

## Final gate
STOP. Full review on preview (all screens, both themes, mobile + desktop). The
builder reviews EVERY design and must explicitly approve. Do NOT merge to main on
your own — merge only after the builder gives sign-off, ideally when no vote is
mid-submission, and after a final check against the live data.
