# Effort Map: MLBB Hero Tier List Mobile Dashboard

## Notes
Implementation effort for the mobile-first MLBB hero tier list web app based on empirical daily telemetry directly from Moonton's Game Management System (`api.gms.moontontech.com`).
Follows the architecture locked in [ADR 0001](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/docs/adr/0001-direct-gms-ingestion-and-ssg-cache-pipeline.md), [ADR 0002](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/docs/adr/0002-composite-power-score-and-tier-assignment-formula.md), and [ADR 0003](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/docs/adr/0003-mobile-web-draft-ux-and-filter-taxonomy.md), specified in [`.scratch/hero-tierlist/spec.md`](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/.scratch/hero-tierlist/spec.md).

## Decisions so far
- **Research & Prototype**: Validated direct Moonton GMS API with dynamic HMAC-SHA1 signing (`crypto` + `fetch`), achieving ~180ms latency and 100% repeatability. Captured in `.agents/handoffs/handoff-moonton-direct-rank-results.md` and `prototype/prototype_direct_fetch.mjs`.
- **Scoring & Normalization**: Composite Power Score ($50\%\text{ WR} + 25\%\text{ PR} + 25\%\text{ BR}$) with Min-Max normalization and Niche Dampening ($\text{PR} < 0.5\% \implies$ Tier $\le \text{B}$).
- **Mobile UX**: Esports Dark Cyber theme, dense 4-column avatar grid, sticky thumb carousel for lanes with flex-pick support, ban priority quick sort, and bottom sheet drawer with top 3 synergies.
- **Ingestion & Scoring Engine (Ticket 01)**: Built complete pipeline (`src/pipeline/`) with dynamic HMAC-SHA1 GMS signing, 3-tier failover (GMS -> Rone Arena -> Local airgap), Min-Max normalization, Power Score formula, B-tier niche dampening, multi-lane flex picks, top 3 synergies, and static JSON exports (`public/data/`). Verified by 12 unit tests in `tests/`. Resolved in [01-ingestion-pipeline-and-scoring-engine.md](issues/01-ingestion-pipeline-and-scoring-engine.md).

## Issues / Vertical Slices
- [01-ingestion-pipeline-and-scoring-engine.md](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/.scratch/hero-tierlist/issues/01-ingestion-pipeline-and-scoring-engine.md) (Blocked by: None) — Status: resolved
- [02-mobile-tier-list-view-and-grid.md](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/.scratch/hero-tierlist/issues/02-mobile-tier-list-view-and-grid.md) (Blocked by: 01 - UNBLOCKED) — Status: ready-for-agent
- [03-lane-tabs-carousel-and-flex-picks.md](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/.scratch/hero-tierlist/issues/03-lane-tabs-carousel-and-flex-picks.md) (Blocked by: 02) — Status: ready-for-agent
- [04-debounced-search-and-ban-priority-sort.md](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/.scratch/hero-tierlist/issues/04-debounced-search-and-ban-priority-sort.md) (Blocked by: 02) — Status: ready-for-agent
- [05-hero-detail-bottom-sheet-drawer.md](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/.scratch/hero-tierlist/issues/05-hero-detail-bottom-sheet-drawer.md) (Blocked by: 02) — Status: ready-for-agent
- [06-rank-time-toggles-and-automated-build.md](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/.scratch/hero-tierlist/issues/06-rank-time-toggles-and-automated-build.md) (Blocked by: 01, 03, 04, 05) — Status: ready-for-agent

## Fog
- [ ] Determine exact CDN image asset caching behavior on GitHub Pages or hosting target.
- [ ] Confirm whether Moonton's hero catalog CDN endpoint changes version path (`homepage_2_1_41`) on every major game patch.
