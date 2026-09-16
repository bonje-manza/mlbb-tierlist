# 02: Power Score Recalculation Engine

Type: task
Status: resolved
Blocked by: 01

## Problem
Currently, power score calculation and tier assignment in `src/pipeline/scoring.ts` assume fixed 50/25/25 weights and mandatory niche dampening. We need a pure client-side utility function that can recompute power scores, tiers, and rankings across any hero dataset with arbitrary relative weights ($W_{\text{WR}}, W_{\text{PR}}, W_{\text{BR}}$) and a configurable `dampenNiche` flag.

## Scope
1. Define `PowerScoreWeights` interface and default presets (`DEFAULT_WEIGHTS`, `PRESETS`) in `src/types/index.ts` or `src/utils/scoringEngine.ts`.
2. Implement `recalculateHeroPowerScores(heroes: NormalizedHero[], weights: PowerScoreWeights): NormalizedHero[]` pure function:
   - Derives pool bounds ($WR_{\min/\max}, PR_{\min/\max}, BR_{\min/\max}$).
   - Normalizes raw weights: $w_i = W_i / \sum W$ (defaults to 50/25/25 if sum is 0).
   - Calculates dynamic `PowerScore` rounded to 1 decimal.
   - Assigns tier according to standard thresholds ($85, 75, 60, 45, 30$).
   - Respects `weights.dampenNiche`: if true, cap at B Tier for $PR < 0.005$; if false, allow higher tiers.
   - Sorts descending by powerScore then winRate.
3. Add unit test suite in `tests/scoringEngine.test.ts` covering normalization ratios, fallback on zero sum, dampening toggle behavior, and preset outputs.

## Answer
Implemented in [src/utils/scoringEngine.ts](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/src/utils/scoringEngine.ts) and [src/types/index.ts](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/src/types/index.ts). Added comprehensive unit tests in [tests/scoringEngine.test.ts](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/tests/scoringEngine.test.ts). All 17 tests passed.
