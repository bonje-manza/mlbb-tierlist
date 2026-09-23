# Effort Map: Viable Counter Picks

## Notes
Implementation effort for empirical counter picks ingestion and dedicated mobile dashboard view based on Moonton GMS `match_type: 1` head-to-head telemetry.
Follows [ADR 0006](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/docs/adr/0006-counter-picks-data-ingestion-via-gms.md) and [`.scratch/counter-picks/spec.md`](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/.scratch/counter-picks/spec.md).

## Decisions so far
- **Moonton GMS API Mechanism**: Discovered that Moonton GMS `/api/gms/source/2669606/{sourceId}` supports `match_type: 1` (`camp_type: 1`) for head-to-head enemy counters. `sub_hero_last` represents heroes where the subject hero drops win rate (negative `increase_win_rate`); `sub_hero` represents heroes where the subject hero gains win rate.
- **Lifting the 5-Cap via Cross-Mining**: GMS caps sub-records to 5 items. By mining across all 133 hero records in the dataset, we combine both direct drops and reciprocal advantages, yielding 10–25 statistically viable counters per hero.
- **Significance Threshold**: Counters are filtered at >= 1.0% win-rate advantage and classified as `hard` (>= 3.0%), `strong` (1.5% - 2.9%), or `soft` (1.0% - 1.4%).
- **Dedicated Counter View**: Added `CounterView.tsx` with enemy target selector, lane tabs, role pills, sorted counter grid, empty state recovery, and deep-linking support (`?view=counters&target=<heroId>`).
- **Drawer Integration**: Added viable counters section in `HeroDetailDrawer.tsx` with "View all" deep-link.

## Issues / Vertical Slices
- [01-viable-counter-picks-pipeline-and-ui.md](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/.scratch/counter-picks/issues/01-viable-counter-picks-pipeline-and-ui.md) (Blocked by: None) — Status: resolved
