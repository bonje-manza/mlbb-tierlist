# 04: Multi-Hero Draft Picker & Live Recommendation UI

Type: task
Status: resolved
Blocked by: 02, 03

## Problem
Build the interactive draft assistant user interface (`DraftView.tsx`) allowing players to configure enemy and allied picks and view prioritized hero recommendations during a live draft.

## Scope
- Enemy roster bar with up to 5 pick slots and quick delete.
- Allied roster bar with up to 4 pick slots (excluding the player's upcoming pick).
- Fast modal / bottom-sheet hero search selector to assign heroes to empty slots.
- Pick exclusivity: Selected heroes cannot be selected again or appear in the recommendation list.
- Recommendation list:
  - Lane filter carousel (`All`, `Gold`, `EXP`, `Mid`, `Roam`, `Jungle`).
  - Cards showing hero portrait, name, lanes, CDR badge, counter score breakdown, and Kryptonite warnings.
- Responsive mobile-first design with smooth touch interactions.

## Answer
Implemented `src/components/DraftView.tsx` containing:
1. Drafting Rosters Board with interactive enemy slots (0-5) and allied slots (0-4), displaying assigned lane tags and quick remove `✕` buttons.
2. In-modal search picker allowing rapid hero selection while respecting Pick Exclusivity.
3. Live Team Hygiene Diagnostic Bar flagging damage monoculture, missing jungler, and frontline presence.
4. Lane Filter Carousel (`All`, `Gold`, `EXP`, `Mid`, `Roam`, `Jungle`) with dynamic count badges.
5. Recommendation Card Stack rendering color-coded CDR Score badges, metric breakdowns (Counter shift vs team, Ally synergy, Base PS), Kryptonite Hard-Counter warning pills, and 1-tap "+ Pick for Allied Team" action.
Validated by unit tests in `tests/components/DraftView.test.tsx`.
