# 04 — Redesign: Create-an-Election Flow (admin) + Admin Panel

> Feed after 03. Make creating and managing elections clearer. UI only — all
> admin logic, eligibility writes, and Supabase operations stay unchanged.

## Core idea
Admins create elections (custom date ranges), set eligibility (who can vote / be
voted for), and manage team members. Make these forms clean, guided, and hard to
get wrong — without changing what they do.

## What to change (UI only)
- Restyle the create-election form with IQ.wiki tokens: logical grouping (name →
  dates → eligibility), clear labels, helpful inline hints, obvious primary action.
- Make date-range selection clear; validate visually (end after start) mirroring
  existing rules — no new logic.
- Eligibility control: a clean, scannable way to set voters and candidates
  (search/filter lists, clear selected state in pink). Restyle whatever control
  exists; keep the data it produces identical.
- Admin panel + member management: consistent tables/lists, clear roles, tidy
  actions, confirmation on destructive actions (restyle existing confirmations).
- Both themes, accessible, responsive.

## Constraints
- DO NOT change eligibility logic, election creation logic, role/permission logic,
  or Supabase writes. Restyle and reorganize the UI only.
- Keep admin-only gating exactly as-is (never expose admin UI to non-admins).

## Negative prompt
No logic/permission/DB changes. No weakening admin gating. No removing
confirmations on destructive actions. No off-brand colors.

## Success
Admins can create an election and set eligibility with less friction and less
chance of error; everything writes exactly as before; on-brand in both themes.

## Gate
STOP. Review on preview (both themes). Confirm admin gating still holds. Approve
before 05.
