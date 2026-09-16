# 05: Local Storage and URL Sync

Type: task
Status: resolved
Blocked by: 04

## Problem
Custom formula weights should persist across page refreshes and be easily shareable via URL parameters so players and creators can distribute customized tier lists.

## Scope
1. Implement serialization/deserialization helpers for weights:
   - Key: `mlbb_power_score_weights`.
   - URL Params: `wr`, `pr`, `br`, `dampen`.
2. On initial dashboard mount, resolve weights in priority order:
   - URL query parameters (if present and valid).
   - `localStorage` cached weights.
   - `DEFAULT_WEIGHTS` (50/25/25, dampen true).
3. On weight changes, update `localStorage` and URL parameters (`window.history.replaceState`). If weights match default, strip query parameters from URL to maintain clean links.
4. Add integration tests covering persistence and URL syncing.

## Answer
Implemented in [src/components/TierListDashboard.tsx](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/src/components/TierListDashboard.tsx) via `resolveInitialWeights()` and `syncUrlAndStorage()`. Tested with end-to-end integration tests in [tests/components/weightControls.test.tsx](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/tests/components/weightControls.test.tsx).
