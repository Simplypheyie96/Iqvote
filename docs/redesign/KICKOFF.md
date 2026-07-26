# Kickoff — paste this as your FIRST message to Claude Code

> Open Claude Code in your IQ Vote repo, make sure the redesign files (00–05,
> THEME-tokens.css, README) are available, then paste the message below.

---

## First message to paste

I want to redesign IQ Vote — my live internal voting app for IQ.wiki / BrainDAO —
to align it with the IQ.wiki design system. This folder has the plan: 00-CLAUDE.md,
THEME-tokens.css (the IQ.wiki theme), numbered files 01–05, and a README.

CRITICAL — read carefully before doing anything:
- This is a VISUAL redesign ONLY. The app is LIVE, uses a real Supabase database,
  and a vote may be running. Do NOT change the database, schema, RLS, auth logic,
  vote scoring, eligibility, or email logic. Only styling, layout, components, and
  front-end polish.
- Do ALL work on a NEW git branch and review on a Vercel PREVIEW deploy. Never push
  to production while a vote is live.

Steps:
1. Copy 00-CLAUDE.md to the repo root and rename it to CLAUDE.md.
2. Read the README for the build order, and THEME-tokens.css for the design system.
3. Work through the numbered files ONE AT A TIME, stopping at each file's gate for
   my review on the preview URL before continuing.

Start with 01-setup-and-theme.md: create the branch, confirm the preview deploy,
wire the IQ.wiki theme tokens (both light and dark), and give me the audit. Do NOT
change any data or logic. WAIT for my approval on the audit before going further.

---

## Reminders for me (the builder)

- Review every step on the Vercel preview URL, in BOTH light and dark, before
  approving the next file.
- If Claude ever proposes a database, schema, or logic change, say no — this is
  visual only.
- Merge to production only when I'm happy and ideally when no vote is mid-way.
- Keep Supabase + Brevo keys in environment variables, never in the repo.

---
*Drafted with Dia*
