# 01: Ingestion Pipeline and Scoring Engine

Type: task  
Status: resolved  
Blocked by: None  

**What to build:**  
Build the complete data ingestion and scoring pipeline that fetches daily MLBB hero match telemetry, normalizes statistics, computes composite power scores with niche-pick dampening, maps lanes, extracts partner synergies, and exports static JSON datasets.

### Context & References
- Spec: [`.scratch/hero-tierlist/spec.md`](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/.scratch/hero-tierlist/spec.md) (Stories 11, 13, 14, 22)
- Architecture: [ADR 0001: Direct GMS Ingestion & SSG Cache Pipeline](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/docs/adr/0001-direct-gms-ingestion-and-ssg-cache-pipeline.md)
- Scoring Math: [ADR 0002: Composite Power Score & Tier Assignment Formula](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/docs/adr/0002-composite-power-score-and-tier-assignment-formula.md)
- Domain Glossary: [`CONTEXT.md`](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/CONTEXT.md)
- Prototype Verification: `prototype/prototype_direct_fetch.mjs`

---

### Core Requirements

1. **Moonton GMS Client with Dynamic Signing**:
   - Handshake: `GET https://api.gms.moontontech.com/api/act/basev4` with headers `X-AppId: 2669606`, `X-ActId: 2669607`, `X-Lang: en` to retrieve `data.server.enigma`.
   - Query: `POST https://api.gms.moontontech.com/api/gms/source/2669606/{sourceId}` with body `pageSize: 200` to fetch all 133 heroes in a single request.
   - HMAC-SHA1 signature generator: `crypto.createHmac('sha1', enigma).update(['POST', path, '', JSON.stringify(payload)].join('\n')).digest('hex')`.
   - Support rank tiers: `bigrank: "7"` (Mythic) and `bigrank: "101"` (All Ranks).
   - Support time windows: `sourceId: "2756567"` (Past 1 Day) and `sourceId: "2756569"` (Past 7 Days).

2. **Automated Upstream Failover Hierarchy**:
   - Primary: Direct Moonton GMS API.
   - Secondary: Rone Arena API fallback (`https://arena.rone.dev/api/heroes/rank?days={1|7}&rank={mythic|all}&size=200`).
   - Tertiary: Local static airgap JSON snapshot if both network endpoints fail.

3. **Normalization & Composite Power Score Engine**:
   - Min-Max normalization of Win Rate (WR), Pick Rate (PR), and Ban Rate (BR) across the active hero pool:
     $$\text{WR\_norm}_i = \frac{\text{WR}_i - \text{WR}_{\min}}{\text{WR}_{\max} - \text{WR}_{\min}} \times 100$$
     $$\text{PR\_norm}_i = \frac{\text{PR}_i - \text{PR}_{\min}}{\text{PR}_{\max} - \text{PR}_{\min}} \times 100$$
     $$\text{BR\_norm}_i = \frac{\text{BR}_i - \text{BR}_{\min}}{\text{BR}_{\max} - \text{BR}_{\min}} \times 100$$
   - Composite Power Score:
     $$\text{PowerScore}_i = (\text{WR\_norm}_i \times 0.50) + (\text{PR\_norm}_i \times 0.25) + (\text{BR\_norm}_i \times 0.25)$$
   - Fixed Tier Thresholds:
     - S+ Tier: $\ge 85.0$
     - S Tier: $75.0 \text{--} 84.99$
     - A Tier: $60.0 \text{--} 74.99$
     - B Tier: $45.0 \text{--} 59.99$
     - C Tier: $30.0 \text{--} 44.99$
     - D Tier: $< 30.0$
   - Niche Dampening Invariant: If raw Pick Rate $< 0.5\%$ ($\text{PR} < 0.005$), the hero is capped at **B Tier** regardless of Power Score.

4. **Hero Catalog & Multi-Lane Mapping**:
   - Ingest canonical hero list from official CDN: `https://akmweb.youngjoygame.com/web/svnres/mlbb/homepage_2_1_41/latest/en_hero_list.json`.
   - Lane code mapping (`roadsort`):
     - `5` -> `Gold Lane`
     - `4` -> `Jungle`
     - `3` -> `Roam`
     - `2` -> `Mid Lane`
     - `1` -> `EXP Lane`
   - Multi-lane flex picks mapped to each valid lane string array.

5. **Synergy Partner Extraction**:
   - Extract top 3 synergistic teammate heroes from `sub_hero` records with positive win rate deltas (`increase_win_rate > 0`), sorted descending by delta.

6. **CLI Runner & Export Format**:
   - Sync script generating `TierListDataset` static JSON bundles (for combinations of rank: `mythic`/`all` and window: `1d`/`7d`).
   - Conforms strictly to the `TierListDataset` schema in Spec Section 5.

---

### Acceptance Criteria

- [x] `fetchMoontonRankTelemetry` successfully signs and queries Moonton GMS, returning all 133 heroes with `pageSize: 200`.
- [x] GMS response envelope errors (`json.code !== 0`) and HTTP network failures trigger graceful failover to Rone Arena API, then to airgap snapshot.
- [x] Min-Max normalization correctly maps the active hero pool to 0-100 scale for WR, PR, and BR.
- [x] Power Score calculation conforms to $50\% \text{ WR} + 25\% \text{ PR} + 25\% \text{ BR}$.
- [x] Tier thresholds correctly assign S+, S, A, B, C, D bands with exact boundary conditions.
- [x] Niche-pick dampening caps any hero with Pick Rate $< 0.5\%$ at B Tier.
- [x] Multi-lane heroes (e.g., Chou) are assigned to multiple lanes in `hero.lanes`.
- [x] Top 3 synergies with positive win-rate deltas are correctly extracted and sorted.
- [x] Pipeline export command generates valid `TierListDataset` JSON artifacts with accurate ISO UTC timestamp and patch version.
- [x] Automated unit test suite verifies normalization math, boundary conditions, niche dampening, and failover behavior.

---

## Answer

The telemetry ingestion pipeline and scoring engine have been implemented and verified end-to-end:
1. **Moonton GMS Client & Dynamic Signing** (`src/pipeline/signer.ts`): Handshake against `/api/act/basev4` retrieves runtime `enigma`, and `generateGmsSignature` computes HMAC-SHA1 hex tokens across query parameters and JSON payloads.
2. **3-Tier Upstream Failover** (`src/pipeline/fetcher.ts`): Primary queries Moonton GMS; on network or envelope error (`code !== 0`), it falls back to Rone Arena REST API (`arena.rone.dev`), and falls back to local airgap snapshot (`data/airgap/`) if both networks fail.
3. **Scoring & Normalization Engine** (`src/pipeline/scoring.ts`): Implemented pure `processHeroTelemetry` with Min-Max normalization to 0-100 scale, composite Power Score formula ($50\%\text{ WR} + 25\%\text{ PR} + 25\%\text{ BR}$), fixed tier boundaries (S+, S, A, B, C, D), strict niche-pick dampening (Pick Rate $< 0.5\% \implies$ max B Tier), multi-lane flex pick mapping from `roadsort`, and Top 3 teammate synergies sorted descending by positive win-rate delta.
4. **Canonical Catalog & Lane Codes** (`src/pipeline/catalog.ts`): Ingests canonical hero list with local airgap cache, mapping `roadsort` IDs (1 -> EXP Lane, 2 -> Mid Lane, 3 -> Roam, 4 -> Jungle, 5 -> Gold Lane).
5. **Sync CLI Runner & Static Data Export** (`src/pipeline/sync.ts`): Generates all 4 permutation datasets (`tierlist-mythic-1d.json`, `tierlist-mythic-7d.json`, `tierlist-all-1d.json`, `tierlist-all-7d.json`) and `meta-tierlist.json`, with automated airgap caching.
6. **Automated Unit Tests** (`tests/scoring.test.ts`, `tests/signer.test.ts`, `tests/failover.test.ts`, `tests/sync.test.ts`): 12 passing tests verifying all mathematical formulas, boundary conditions, niche dampening, flex lanes, failovers, and dataset generation.

