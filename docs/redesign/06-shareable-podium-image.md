# 06 — Shareable Podium Image (PM announces the winner)

> Feed after 05 (the podium exists). Adds a PM/admin-only "Share podium" feature
> that exports a branded image of the top 3 to announce results. Front-end only —
> reads existing leaderboard data; no backend/DB/logic changes.

## Core idea
After an election closes, the PM can generate a clean, branded IMAGE of the podium
(1st / 2nd / 3rd) to post when announcing the winner — so the runner-up and third
place are shown and honored too. One tap → download a crisp PNG.

## Access
- The "Share podium" action is **admin / PM only** (gate it the same way other
  admin-only UI is gated — do NOT change permission logic, just show/hide the
  button by the existing role check).

## How it works (front-end only)
- Reads the ALREADY-COMPUTED leaderboard standings (top 3) for the selected
  election/period. Do not add queries or change how standings are computed.
- Generates a **dedicated share card** (a purpose-built export layout, NOT a raw
  screenshot of the live screen) so it's always crisp and consistent regardless of
  screen size or theme. Render to canvas and download as PNG.
- Suggested tech: a canvas render (e.g. html-to-image on a hidden, fixed-size
  export component, or direct canvas drawing). Keep any dependency free + light.

## The share card design (premium + branded)
- IQ.wiki identity: pink accent, logo/wordmark, clean background (offer light or
  dark card — default can match current theme).
- A real **podium**: 1st tallest and centered, 2nd left, 3rd right, tiered heights,
  medal/rank treatment. 1st gets the strongest emphasis.
- For each of the 3: name, rank, and points. Optionally the election title + month
  (e.g. "Employee of the Month — July 2026").
- Tasteful, celebratory, uncluttered — this represents the team publicly, so it
  must look polished.

## Dimensions
- Default: a landscape post/link-preview size (e.g. 1200×675) that looks good in
  Slack/Telegram. Optionally also offer a square (1080×1080).
- Export at 2x pixel density for crispness.

## Flow
1. PM opens the leaderboard for a (closed) election.
2. Taps "Share podium" (admin/PM only).
3. Optional quick options: light/dark card, size (if offering both).
4. Preview the card, then Download PNG. (Native share sheet on mobile is a nice
   bonus if easy; download is the baseline.)

## Constraints
- UI/front-end only. No DB, schema, standings-computation, or permission-logic
  changes — only read existing data + gate by the existing role check.
- No new paid services. Keep dependencies free + light.

## Negative prompt
No backend or data changes. No exposing the button to non-admins. No low-quality
screenshot that looks inconsistent — use the dedicated export card. No off-brand
styling. No cut-off names/points at any size.

## Success
The PM can, in a couple of taps, download a crisp, branded podium image showing
1st/2nd/3rd, and post it to announce results — looking premium and on-brand.

## Gate
STOP. Review the generated image (both card themes, both sizes if offered) on the
preview. Approve before considering it done. Do not merge without builder sign-off.
