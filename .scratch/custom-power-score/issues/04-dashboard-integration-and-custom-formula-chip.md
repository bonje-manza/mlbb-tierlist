# 04: Dashboard Integration and Custom Formula Chip

Type: task
Status: resolved
Blocked by: 03

## Problem
The dashboard needs to wire the weight tuning drawer, recalculate hero rankings efficiently upon state changes, and clearly indicate to the user when a custom formula is active.

## Scope
1. Add "Weights" button to `DraftControls.tsx` with slider/tune icon.
2. In `TierListDashboard.tsx`:
   - Hold `weights` state initialized from storage/URL.
   - Memoize recalculated dataset with `recalculateHeroPowerScores`.
   - Manage `isWeightDrawerOpen` state.
   - When custom weights are active (deviating from 50/25/25 or dampening false), display an active status badge on the button and an inline dismissible chip in the controls bar with a 1-tap `✕` reset button.
3. Pass recalculated hero data down to LaneCarousel counts, search filter, and TierSections seamlessly.

## Answer
Implemented in [src/components/DraftControls.tsx](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/src/components/DraftControls.tsx) and [src/components/TierListDashboard.tsx](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/src/components/TierListDashboard.tsx). Recalculation is memoized with `useMemo` for sub-millisecond execution. When custom weights are active, an active indicator dot and custom formula chip with 1-tap reset action are displayed. Tested in [tests/components/weightControls.test.tsx](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/tests/components/weightControls.test.tsx).
