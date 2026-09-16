# Map: Custom Power Score Weighting

Effort to allow users to modify power score weights (Win Rate, Pick Rate, Ban Rate) with default values, live client-side re-ranking, and presets.

## Notes
- Official formula (ADR 0002): $50\% \text{ WR}, 25\% \text{ PR}, 25\% \text{ BR}$.
- Tier bounds: $S+ \ge 85, S \ge 75, A \ge 60, B \ge 45, C \ge 30, D < 30$.
- Invariant: $PR < 0.5\% \implies$ capped at B tier (toggleable by user under ADR 0005).

## Decisions So Far
- **01 Grilling Power Score Weight Controls**: Relative normalized sliders (0-100), user-toggleable niche pick dampening, bottom sheet drawer with 4 presets, `localStorage` and URL query parameter synchronization. Formalized in [ADR 0005](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/docs/adr/0005-custom-power-score-weighting.md).
- **02 Power Score Recalculation Engine**: Implemented pure `recalculateHeroPowerScores` utility and normalization logic in [src/utils/scoringEngine.ts](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/src/utils/scoringEngine.ts). Verified with 17 tests in [tests/scoringEngine.test.ts](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/tests/scoringEngine.test.ts).
- **03 Weight Tuning Drawer and Presets UI**: Mobile bottom sheet drawer implemented in [src/components/WeightTuningDrawer.tsx](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/src/components/WeightTuningDrawer.tsx) with presets, sliders, and dampening toggle.
- **04 Dashboard Integration and Custom Formula Chip**: Integrated into [src/components/DraftControls.tsx](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/src/components/DraftControls.tsx) and [src/components/TierListDashboard.tsx](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/src/components/TierListDashboard.tsx) with live memoized recalculation and 1-tap reset chip.
- **05 Local Storage and URL Sync**: Dual persistence via `localStorage` and URL parameters implemented and verified.

## Frontier
All tickets resolved. 104 vitest tests and 17 node pipeline tests passing. Bundle size 14.41 KB gzip (limit 50 KB).
