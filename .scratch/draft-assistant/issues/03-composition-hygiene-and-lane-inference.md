# 03: Composition Hygiene & Lane Inference Utilities

Type: task
Status: resolved
Blocked by: 01

## Problem
Evaluate structural team composition health and infer primary lanes for heroes to support the CDR engine and draft diagnostics.

## Scope
- Implement `inferPrimaryLane(hero)` extracting canonical primary lane from `hero.lanes[0]`.
- Implement `evaluateCompositionHygiene(teamHeroes)` evaluating:
  - Damage type distribution (Physical vs Magic count).
  - Jungler / Retribution availability.
  - Marksman count / duplicate carry penalty.
  - Frontline / tank presence.
- Return both numeric score penalty deductions and descriptive status badges/diagnostics.
- Add unit tests validating composition flags for diverse team combinations.

## Answer
Implemented `src/utils/draftHygiene.ts` containing:
1. `inferPrimaryLane(hero)`: Derives canonical primary lane from `lanes[0]`.
2. `getHeroDamageType(hero)`: Identifies Physical vs Magic profile across roles and known hybrid/magic heroes.
3. `isFrontlineHero(hero)` and `isPureMarksman(hero)`: Structural role diagnostics.
4. `evaluateCompositionHygiene(teamHeroes)`: Evaluates damage monoculture ($-8.0\text{ pts}$ for $\ge 4$ physical/magic), missing jungler ($-15.0\text{ pts}$ at 5 heroes), marksman overlap ($-10.0\text{ pts}$), and frontline deficit ($-6.0\text{ pts}$), returning both score penalties and visual diagnostics.
Validated by unit tests in `tests/draftHygiene.test.ts`.
