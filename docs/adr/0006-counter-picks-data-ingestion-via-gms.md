# ADR 0006: Counter Picks Data Ingestion via Moonton GMS

## Status
Accepted

## Context
We want to build a counter picks page on this repository based on Mobile Legends: Bang Bang (MLBB) statistics, similar to `mlbb.gg/counter`. To do this, we need to understand how counter data is officially sourced and how third-party sites like MLBB.gg retrieve it.

Based on our research into the official game ecosystem and MLBB.gg's architecture, there is no public-facing developer API. Instead, we must utilize Moonton's internal telemetry API.

## Research Findings
1. **Source of Counter Data**: MLBB.gg does not maintain its own dataset of match records. As stated on their site, "Statistics are imported from Moonton for all ranks". They fetch their matchup data from the same official Moonton internal REST service this repository already uses: `https://api.gms.moontontech.com`.
2. **The Counter Endpoint Fields**: The Moonton GMS API (`/api/gms/source/2669606/{sourceId}`) supports specific GraphQL-like field selection. By requesting `data.sub_hero.hero`, `data.sub_hero.heroid`, and `data.sub_hero.increase_win_rate`, the API provides the direct head-to-head matchup advantage.
3. **Win-Rate Shift**: The `increase_win_rate` field returned by Moonton perfectly maps to MLBB.gg's "Exact win-rate change" (e.g., "-7.09 pp"). It represents the percentage point (pp) shift in the main hero's win rate when encountering the sub hero.
4. **SSG and Next.js Architecture**: Inspecting `mlbb.gg/counter` reveals that it is built with Next.js App Router. The matchup data (like the exact win-rate change strings) is baked into the Server-Side Generated (SSG) HTML payloads. The client browser never makes a direct API request to Moonton or to a public `mlbb.gg` API endpoint for counter data. This mirrors our existing ADR-0001 (Direct GMS Ingestion & SSG Cache Pipeline).

## Decision
1. **Extend Existing GMS Pipeline**: We will extend our current GMS ingestion script (`src/pipeline/fetcher.ts`) to ensure it caches the `data.sub_hero.*` fields.
2. **Calculate Matchup Strengths**: We will parse the `data.sub_hero.increase_win_rate` to determine counter strength (e.g., Very Strong, Strong, Moderate, Slight) exactly as we map tier-list power scores.
3. **Threshold for Viability**: A counter is considered "viable" and will be included in the list only if it has a statistically significant positive win-rate shift (e.g., > 1%).
4. **Pre-render as Static JSON/SSG**: Following ADR-0001, this counter data will be normalized into static JSON files during our daily GitHub Actions cron workflow and served statically to the mobile web frontend to avoid WAF blocks and ensure high availability.
5. **UI Presentation**: The frontend will display viable counters as a simple sorted grid/list of hero portraits from strongest to weakest counter. It will only display "who counters them" (not who they counter). A filter will be included to allow filtering the counter heroes by their lane/role.

## References
* **MLBB.gg Counter Page**: [https://mlbb.gg/counter](https://mlbb.gg/counter) (Primary reference for exact win-rate change metric).
* **Moonton GMS API**: `https://api.gms.moontontech.com` (Discovered via `src/pipeline/fetcher.ts` and confirmed as the source of `increase_win_rate`).
* **ADR-0001**: Direct GMS Ingestion & SSG Cache Pipeline.
