# Issue 01: Viable Counter Picks Pipeline and Dedicated UI

Type: task
Status: resolved
Blocked by: None

## Description
Ingest Moonton GMS `match_type: 1` counter telemetry across all rank and window combinations, compute all statistically viable counter picks (>= 1.0% shift) by aggregating direct drops and reciprocal advantages, and build the dedicated Counter Picks UI with filtering and drawer navigation.

## Acceptance Criteria
- [x] GMS fetcher queries `match_type: 1` with HMAC signature and airgap fallback.
- [x] Scoring engine mines both `sub_hero_last` and reciprocal `sub_hero` records across all 133 heroes, lifting the 5-item cap.
- [x] Classifies counter strength as `hard` (>= 3.0%), `strong` (1.5% - 2.9%), and `soft` (1.0% - 1.4%).
- [x] Generated datasets in `public/data/`, `data/airgap/`, and `public/meta-tierlist.json` contain populated `counters` arrays.
- [x] Dedicated `CounterView.tsx` with enemy target selector, lane tabs, role pills, and sorted counter grid.
- [x] `HeroDetailDrawer.tsx` includes viable counters section with 1-tap navigation to `CounterView`.
- [x] URL query synchronization (`?view=counters&target=<heroId>`).
- [x] All 19 node unit tests and 112 vitest component tests pass. Bundle size <= 50 KB gzip.

## Answer
Resolved. Ingestion fetcher (`src/pipeline/fetcher.ts`), extraction logic (`src/pipeline/scoring.ts`), sync workflow (`src/pipeline/sync.ts`), and UI components (`src/components/CounterView.tsx`, `src/components/HeroDetailDrawer.tsx`, `src/components/TierListDashboard.tsx`) have been implemented and verified with 131 automated tests passing.
