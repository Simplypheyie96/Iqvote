# Premium Review Checklist

> Run each screen/design against this before you approve it on the Vercel preview.
> The bar: "does this feel like an expensive, polished, modern app?" If several
> boxes fail, send it back before approving. Keep it fast — this is your gate.

## For EVERY screen (both light AND dark, mobile AND desktop)

### Look & consistency
- [ ] Rounded corners consistent with the app's radius language (cards, buttons,
      inputs, modals, nav).
- [ ] The rounded floating nav bar is present and looks right.
- [ ] IQ.wiki pink used with restraint — for primary action / active state, not
      everywhere.
- [ ] Spacing feels generous and rhythmic; nothing cramped or misaligned.
- [ ] Typography hierarchy is clear (headings vs. body vs. labels).
- [ ] Matches the rest of the app — no screen feels "off" or older.

### States (the premium tell)
- [ ] Hover state on interactive elements.
- [ ] Press/active state.
- [ ] Visible focus state (keyboard users).
- [ ] Loading state (skeletons, not jarring spinners where possible).
- [ ] Empty state (helpful, not a blank void).
- [ ] Error state (clear, on-brand, not a raw error).
- [ ] Disabled state where relevant.

### Motion
- [ ] Transitions are smooth and subtle, never flashy.
- [ ] Respects reduced-motion (no essential info conveyed by motion alone).

### Accessibility
- [ ] AA+ contrast everywhere — CHECK pink text/buttons on dark especially.
- [ ] Fully keyboard-navigable; logical tab order.
- [ ] Tap targets comfortable on mobile.

### Responsive
- [ ] Looks right on a phone (this app is used on phones).
- [ ] Looks right on desktop.
- [ ] Nothing cut off, overflowing, or overlapping at any size.

---

## Screen-specific extras

### Sign-in / sign-up (02)
- [ ] Clean, on-brand, clearly IQ Vote / BrainDAO.
- [ ] Works exactly as before functionally (I didn't lose any auth behavior).

### Vote flow (03)
- [ ] Ranking (1st/2nd/3rd → 5/3/2) is obvious and satisfying.
- [ ] Can't pick a 4th or duplicate; confirm step present.
- [ ] Points mapping is visible; "one vote, can't change" is clear.
- [ ] Success + already-voted + closed states all look good.

### Create election / admin (04)
- [ ] Form is grouped and guided; hard to get wrong.
- [ ] Eligibility selection is clean and scannable.
- [ ] Admin-only UI still hidden from non-admins.
- [ ] Destructive actions still confirm.

### Leaderboard podium (05)
- [ ] Looks like a REAL podium: 1st tallest + centered, 2nd left, 3rd right.
- [ ] 1st place clearly emphasized; medals/rank treatment reads well.
- [ ] all-time / year / month filter works and looks good.

### Shareable podium image (06)
- [ ] "Share podium" button is admin/PM-only.
- [ ] Exported PNG is crisp (2x), branded, and shows 1st/2nd/3rd clearly.
- [ ] No cut-off names/points; looks good in Slack/Telegram.
- [ ] Light and dark card (and both sizes if offered) all look premium.

---

## Safety re-check (every step)
- [ ] Work is on the branch + preview, NOT production.
- [ ] No database / schema / vote-logic / auth changes were made.
- [ ] The live vote and its data are untouched.
- [ ] I explicitly approve before anything merges to main.

---
*Drafted with Dia*
