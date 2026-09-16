# ADR 0004: Full Ladder Rank & Multi-Window Telemetry Ingestion and UI Controls

## Status
Accepted (Supersedes ADR 0003 Section 2 Rank/Time presets and extends ADR 0001 Section 3)

## Context
ADR 0003 initially defined rank and time presets locked to `Mythic` (`bigrank: 7`) and `All Ranks` (`bigrank: 101`) across `1 Day` (`sourceId: 2756567`) and `7 Days` (`sourceId: 2756569`).

However, ranked players across different skill tiers (from Epic up to Mythical Glory+) encounter substantially different metas, ban priorities, and hero win rates. Furthermore, Moonton GMS publishes statistics across five distinct aggregation windows (Past 1 Day, Past 3 Days, Past 7 Days, Past 15 Days, Past 30 Days), identical to the official `mobilelegends.com/rank` statistics portal.

Supporting the full ladder requires expanding the static dataset ingestion, adapting the failover hierarchy, and replacing horizontal toggle buttons with compact, mobile-first dropdown controls that preserve viewport real estate.

## Decision

1. **Full Ladder Taxonomy & Permutation Scope**:
   * **Rank Tiers (6 total)**:
     * `all`: All Ranks (`bigrank: "101"`)
     * `epic`: Epic (`bigrank: "5"`)
     * `legend`: Legend (`bigrank: "6"`)
     * `mythic`: Mythic (`bigrank: "7"`, default)
     * `honor`: Mythical Honor (`bigrank: "8"`)
     * `glory`: Mythical Glory+ (`bigrank: "9"`)
   * **Time Windows (5 total)**:
     * `1d`: Past 1 Day (`sourceId: "2756567"`, default)
     * `3d`: Past 3 Days (`sourceId: "2756568"`)
     * `7d`: Past 7 Days (`sourceId: "2756569"`)
     * `15d`: Past 15 Days (`sourceId: "2756565"`)
     * `30d`: Past 30 Days (`sourceId: "2756570"`)
   * **Static Dataset Compilation**: 6 ranks × 5 time windows = 30 static datasets compiled as `public/data/tierlist-[rank]-[window].json` (~40KB each, ~1.2MB uncompressed total).

2. **Ingestion Concurrency & Throttling**:
   * Ingestion (`sync.ts`) runs sequentially across the 30 permutations with a 100ms throttle between calls.
   * Total sync runtime remains ~8–12 seconds in CI while eliminating risk of IP rate-limiting or anti-scraping blocks from Moonton GMS.

3. **Extended Failover Routing**:
   * **Primary Tier**: Direct Moonton GMS API with dynamic HMAC-SHA1 signature.
   * **Secondary Tier**: Rone Arena (`arena.rone.dev`) for core tiers (`mythic` / `all` on `1d` / `7d`).
   * **Direct to Airgap**: For extended tiers (`epic`, `legend`, `honor`, `glory`, and `3d`, `15d`, `30d`) which are not indexed by Rone Arena, failures automatically bypass the secondary proxy and fall back directly to the local airgap snapshot (`data/airgap/tierlist-[rank]-[window].json`).

4. **Mobile Web Dual Dropdown UX**:
   * Replace the segmented button groups in `DatasetControls` with dual compact styled native `<select>` elements (`[ Rank: Mythic ▾ ]` and `[ Window: 1 Day ▾ ]`) side-by-side with a 50/50 flex split.
   * Styled with dark-cyber aesthetic (`bg-slate-900/80`, `border-slate-700/80`, focus glow), custom SVG chevron indicators, and minimum 44px touch targets.
   * Trigger native mobile OS pickers (iOS scroll wheel / Android bottom modal sheet) for zero-clipping touch responsiveness.

5. **State Resolution & Persistence Hierarchy**:
   * Filter state resolution precedence:
     1. URL query parameters (`?rank=<rank>&window=<window>`)
     2. `localStorage` keys (`mlbb_tierlist_rank`, `mlbb_tierlist_window`)
     3. Default preset (`mythic`, `1d`)
   * Filter changes write to `localStorage` and synchronize the URL via `window.history.replaceState` without triggering navigation reloads.

## Consequences

### Positive
* **Full Meta Coverage**: Players in any rank from Epic through Mythical Glory+ can view tier lists tailored to their specific skill bracket.
* **Granular Time Trends**: Supports short-term patch response (`1d`) and smoothed long-term balance stability (`30d`).
* **Zero Viewport Clutter**: Dual dropdowns consume the same 48px height as previous 2-button toggles.
* **Resilient**: Airgap snapshots exist for all 30 permutations, guaranteeing offline builds and zero broken client requests.

### Negative
* **Increased Build Artifact Count**: 30 static JSON files generated instead of 4 (negligible size increase of ~1MB uncompressed).
