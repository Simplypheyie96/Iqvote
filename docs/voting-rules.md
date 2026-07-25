# Voting rules

## Scoring

Each voter ranks three colleagues:

| Rank | Points |
|------|--------|
| 1st choice | 5 |
| 2nd choice | 3 |
| 3rd choice | 2 |

Rules enforced by the ballot:

- **Three different people.** The same person cannot occupy two ranks.
- **You may vote for yourself.**
- **Notes are optional** and attached per rank.
- **A submitted vote is final.** There is no edit or re-vote. The UI states this
  before submission, and the server rejects a second ballot for the same
  election.

## Leaderboard ordering

Ranked by total points. Ties break by number of 1st-place votes, then 2nd, then
3rd — so a candidate with more top-choice support outranks one who accumulated
the same score from lower ranks.

Candidates with zero points are excluded rather than listed at the bottom.

## Privacy

This is a contract, not an implementation detail. Admins are also voters, so
letting them see individual choices would bias the election.

Admins **can** see:
- Who has voted, and when
- Aggregate results
- Whether a vote needs deleting

Admins **cannot** see:
- Who any individual person voted for

Notes left on a vote surface to the recipient **anonymously** — the author is
not attached.

## Eligibility

An election's `eligible_employees` list controls **who can receive votes**, not
who can cast them. Any registered user can vote in any open election,
administrators included.
