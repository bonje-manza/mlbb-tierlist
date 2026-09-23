# Specification: Statistically Viable Counter Picks

## Problem Statement
Drafting against high-priority enemy threats requires understanding head-to-head empirical matchups. Instead of showing a fixed or arbitrary 3-to-5 counters, players need to see all statistically viable counter picks for any selected hero based on Moonton GMS telemetry, filterable by lane and role.

## Background & ADR
- **ADR Reference**: [ADR 0006](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/docs/adr/0006-counter-picks-data-ingestion-via-gms.md)
- **Source Endpoint**: Moonton GMS `/api/gms/source/2669606/{sourceId}` with `match_type: 1` (`camp_type: 1` enemy head-to-head).

## Core Requirements
1. **Viable Threshold**: Win-rate shift >= 1.0% advantage / drop.
   - >= 3.0%: Hard Counter (`hard`)
   - 1.5% - 2.9%: Strong Counter (`strong`)
   - 1.0% - 1.4%: Soft Counter (`soft`)
2. **Aggregated Cross-Hero Mining**:
   - GMS returns at most 5 entries in `sub_hero_last` for a single hero.
   - Ingesting all 133 hero records for `match_type: 1` allows collecting both direct drops (`sub_hero_last` of hero A) and reciprocal advantages (`sub_hero` where hero B beats hero A).
   - This uncovers all viable counters (often 10–25 heroes) rather than a fixed 5.
3. **Dedicated Counter View**:
   - Enemy target hero selector with live filter/search.
   - Lane filter carousel with count badges.
   - Role pills filter.
   - Sorted grid of counter hero cards ordered from highest counter advantage to lowest.
   - Clean empty states with quick reset.
4. **Hero Detail Drawer Integration**:
   - "Viable Counters" section below duo synergies showing top counter matchups.
   - 1-tap "View all (N)" action that switches to Counter Picks view targeting that hero.
5. **URL & Navigation**:
   - Header switcher: `Tier List` vs `Counter Picks`.
   - URL sync: `?view=counters&target=<heroId>`.
6. **Airgap & Client Isolation**:
   - ADR-0001 compliance: Client makes zero direct API calls to Moonton GMS. Counter telemetry is pre-ingested into JSON build artifacts and airgap datasets.
