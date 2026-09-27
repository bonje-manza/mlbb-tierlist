# 02: Draft Scoring Engine & Math Core

Type: task
Status: resolved
Blocked by: 01

## Problem
Implement the pure mathematical calculation core for Composite Draft Rating (CDR) based on ADR 0007.

## Scope
- Implement `computeCompositeDraftRating(hero, enemyHeroes, allyHeroes, options)`.
- Implement Kryptonite non-linear penalty for hard counters ($\theta = 3.5, \kappa = 1.5, p = 1.2$).
- Implement lane interaction weight modulation ($\omega_{\text{lane}}$).
- Implement synergy bonus accumulation with $\alpha = 0.75$ damping.
- Add comprehensive unit tests verifying:
  - Exact clamping between $0$ and $100$.
  - Severe penalty triggering when encountering a $>3.5\%$ counter.
  - Neutral behavior when enemy/ally sets are empty (falling back smoothly to PowerScore).

## Answer
Implemented `src/utils/draftEngine.ts` containing:
1. `getHeroMatchupDelta(candidate, enemy)`: Calculates head-to-head empirical percentage point advantage/deficit from counter data.
2. `getHeroSynergyDelta(candidate, ally)`: Computes teammate pairing win-rate delta.
3. `getLaneInteractionWeight(candidate, enemy)`: $1.4\times$ direct lane, $1.2\times$ roam/jungle, $1.0\times$ cross-lane.
4. `computeCompositeDraftRating(candidate, enemies, allies, options)`: Evaluates CDR with non-linear Kryptonite penalty for fatal counters ($> 3.5\%$) and clamps to $[0, 100]$.
5. `rankDraftRecommendations(...)`: Filters out picked heroes, applies lane filters, and sorts descending by CDR.
Validated by unit tests in `tests/draftEngine.test.ts`.
