# Spec: MLBB Hero Tier List Mobile Dashboard

Status: ready-for-agent

## Problem Statement

Mobile Legends: Bang Bang (MLBB) ranked players have approximately 30 seconds per turn during the draft-pick phase to select or ban heroes. During this high-urgency window, players struggle with several key problems:
1. **Outdated or Biased Tier Lists**: Most community tier lists are based on subjective streamer opinions or outdated patch notes rather than empirical match telemetry.
2. **Low-Sample Skew**: Players who look at raw win-rate percentages get misled by niche "cheese" picks (e.g., heroes with 0.08% pick rate but 56% win rate due to specialized one-tricks), while high-priority meta threats (e.g., 50%+ ban rate heroes) are undervalued.
3. **Cluttered Desktop Interfaces on Mobile**: Existing stat websites present massive horizontal tables with dozens of filter dropdowns, failing to fit one-handed smartphone viewports (360px–420px) and requiring tedious pinching/scrolling that causes players to run out of draft time.
4. **Missing Synergy Insights**: Players see individual hero win rates but lack immediate visibility into which teammate heroes create winning synergies with their selected pick.

## Solution

A high-performance, mobile-first web application that delivers glanceable, empirical MLBB hero tier rankings in under 10 seconds.
- **Empirical Telemetry**: Ingests official daily match data directly from Moonton's Game Management System (`api.gms.moontontech.com`) with automated failover to the open-source Rone Arena API (`arena.rone.dev`) and static airgap snapshots.
- **Composite Power Score**: Computes an unskewed, Min-Max normalized score combining Win Rate (50%), Pick Rate (25%), and Ban Rate (25%), with a strict niche-pick dampening gate (heroes with $<0.5\%$ pick rate cannot enter S+).
- **Mobile Draft-Speed UX**: A dense 4-column compact tile grid styled in a high-contrast MOBA Dark Cyber aesthetic, organized into clear tier bands (`S+`, `S`, `A`, `B`, `C`, `D`).
- **One-Handed Navigation**: Sticky thumb-accessible Lane carousel tabs (`All`, `Gold`, `EXP`, `Mid`, `Roam`, `Jungle`) with multi-lane flex-pick inclusion, instant debounced hero search, and a draft "Ban Priority" quick-sort toggle.
- **Tactical Bottom Sheet**: Tapping any hero opens a native mobile drawer revealing exact win/pick/ban metrics and the Top 3 synergistic teammate heroes (`data.sub_hero` with positive win-rate deltas).
- **Zero-Maintenance Static Delivery**: Built and published as static JSON and HTML/JS/CSS via daily GitHub Actions at 01:00 UTC, ensuring zero server costs and sub-50KB initial payload on mobile networks.

## User Stories

1. As a ranked player entering draft, I want to see an empirical tier list on my smartphone screen immediately upon page load, so that I don't waste precious draft time waiting for heavy web assets to load.
2. As a player assigned to Gold Lane, I want to tap a "Gold Lane" tab, so that I can filter down to only viable marksmen and gold-lane carries.
3. As a player assigned to EXP Lane, I want to tap the "EXP Lane" tab, so that I can see top-performing offlaners and bruisers.
4. As a player assigned to Mid Lane, I want to tap the "Mid Lane" tab, so that I can view high-priority mages and burst rotators.
5. As a player assigned to Roam, I want to tap the "Roam" tab, so that I can quickly review the strongest tanks and utility supports.
6. As a player assigned to Jungle, I want to tap the "Jungle" tab, so that I can identify the most effective assassins and objective-securing junglers.
7. As a flex-pick player considering Chou, I want to find him under both "EXP Lane" and "Roam" tabs, so that I can draft him according to my team's needs without guessing which single lane he was arbitrarily assigned to.
8. As a player during the initial 30-second ban phase, I want to toggle a "Ban Priority" sort pill, so that the grid instantly reorders by highest ban rate to highlight must-ban threats.
9. As a player searching for a specific comfort pick (e.g., "Gloo"), I want an instant debounced search bar, so that I can check where my hero sits in the current meta within 2 keystrokes.
10. As a player who made a typo in the search bar, I want a 1-tap "Clear search" button and a clear empty state, so that I can recover my full tier list without manual backspacing.
11. As a competitive player, I want the tier list to default to Mythic rank data, so that rankings reflect high-skill gameplay rather than low-tier casual habits.
12. As a player climbing through Epic or Legend, I want a rank selector toggle to switch to "All Ranks", so that I can compare low-tier versus high-tier meta trends.
13. As a player evaluating fresh meta trends immediately following a patch, I want the data to default to the "Past 1 Day" window, so that I see the fastest response to balance changes.
14. As a player wanting smoother, less volatile statistics, I want a toggle to view the "Past 7 Days" aggregation window, so that day-to-day noise is filtered out.
15. As a player glancing at the screen, I want tier headers (`S+`, `S`, `A`, `B`, `C`, `D`) to be color-coded with distinct neon accents and explicit text badges, so that I can recognize hero tiers in less than a second even with color vision differences.
16. As a player scanning heroes, I want a dense 4-column compact grid of hero portrait tiles, so that I can see almost an entire tier on a single mobile screen without endless vertical scrolling.
17. As a player viewing a hero tile, I want to see the hero's name and win rate percentage directly on the tile, so that I don't have to tap every hero to compare numbers.
18. As a player wanting deeper matchup insight, I want to tap any hero tile to open an animated mobile bottom sheet, so that detailed stats slide up smoothly without navigating to a new page.
19. As a player inspecting a hero in the bottom sheet, I want to see their exact Win Rate, Pick Rate, and Ban Rate percentages with visual benchmark bars, so that I can understand why the hero was assigned their tier score.
20. As a player coordinating team draft synergy, I want to see the Top 3 synergistic teammate heroes in the bottom sheet with their positive win-rate deltas (e.g. "+6.37% WR"), so that I can advise my team on high-synergy dual picks.
21. As a player done inspecting a hero, I want to swipe down or tap outside the bottom sheet, so that it dismisses instantly without blocking my view of the tier list.
22. As a player evaluating data freshness, I want to see an explicit UTC timestamp in the header (e.g., "Data updated: YYYY-MM-DD 01:00 UTC"), so that I know exactly when the telemetry was last refreshed from Moonton.
23. As a player on a slow cellular connection, I want hero portrait avatars to load progressively from Moonton's CDN with fallback placeholders, so that broken images or slow networks do not cause jarring layout shifts.
24. As a player using one thumb on a moving commute, I want all interactive tabs, buttons, and hero tiles to meet or exceed 44x44px touch targets, so that I never mis-tap during a tense draft countdown.

## Implementation Decisions

### 1. Ingestion & Transformation Pipeline
* **Source Endpoints (ADR 0001)**:
  * Handshake: `GET https://api.gms.moontontech.com/api/act/basev4` with headers `X-AppId: 2669606`, `X-ActId: 2669607`, `X-Lang: en` to retrieve `data.server.enigma`.
  * Telemetry: `POST https://api.gms.moontontech.com/api/gms/source/2669606/{sourceId}` signed with HMAC-SHA1(`enigma`).
  * Source IDs: `2756567` (Past 1 Day) and `2756569` (Past 7 Days).
  * Page Size: `200` to capture all 133 heroes in a single request.
  * Rank Tiers: `bigrank: "7"` (Mythic) and `bigrank: "101"` (All Ranks).
* **Failover Protocol**:
  * Primary: Direct Moonton GMS.
  * Secondary Failover: Rone Arena API (`https://arena.rone.dev/api/heroes/rank?days={1|7}&rank={mythic|all}&size=200`).
  * Tertiary Failover: Commit/serve the existing local airgap JSON snapshot if both upstreams fail.
* **Refresh Cadence**: Scheduled daily GitHub Actions cron workflow running at **01:00 UTC** (1 hour after Moonton's 00:00 UTC batch run) + manual `workflow_dispatch`.

### 2. Normalization & Power Score Engine (ADR 0002)
* **Mathematical Formula**:
  * Min-Max Normalization across the active hero pool:
    $$\text{WR\_norm}_i = \frac{\text{WR}_i - \text{WR}_{\min}}{\text{WR}_{\max} - \text{WR}_{\min}} \times 100$$
    $$\text{PR\_norm}_i = \frac{\text{PR}_i - \text{PR}_{\min}}{\text{PR}_{\max} - \text{PR}_{\min}} \times 100$$
    $$\text{BR\_norm}_i = \frac{\text{BR}_i - \text{BR}_{\min}}{\text{BR}_{\max} - \text{BR}_{\min}} \times 100$$
  * Composite Power Score:
    $$\text{PowerScore}_i = (\text{WR\_norm}_i \times 0.50) + (\text{PR\_norm}_i \times 0.25) + (\text{BR\_norm}_i \times 0.25)$$
* **Fixed Tier Thresholds**:
  * **S+ Tier**: $\text{PowerScore} \ge 85$
  * **S Tier**: $75 \le \text{PowerScore} < 85$
  * **A Tier**: $60 \le \text{PowerScore} < 75$
  * **B Tier**: $45 \le \text{PowerScore} < 60$
  * **C Tier**: $30 \le \text{PowerScore} < 45$
  * **D Tier**: $\text{PowerScore} < 30$
* **Niche Dampening Invariant**: If a hero's raw Pick Rate $< 0.5\%$ ($\text{PR} < 0.005$), their tier is capped at **B Tier** regardless of Win Rate or Power Score.

### 3. Hero Catalog & Lane Mapping
* **Canonical Metadata**: Parsed from `https://akmweb.youngjoygame.com/web/svnres/mlbb/homepage_2_1_41/latest/en_hero_list.json`.
* **Lane Identifiers**:
  * Gold Lane (`roadsort: 5`)
  * Jungle (`roadsort: 4`)
  * Roam (`roadsort: 3`)
  * Mid Lane (`roadsort: 2`)
  * EXP Lane (`roadsort: 1`)
* **Multi-Lane Rules**: Heroes with multiple entries in `roadsort` are indexed under each assigned lane tab.

### 4. Frontend Architecture & Mobile Web UX (ADR 0003)
* **Stack**: Vite + React 18+ + Tailwind CSS.
* **Aesthetic Theme**: Competitive Esports / MOBA Dark Cyber (`#0b0f19` ground, `#131b2e` card surfaces, `#1e293b` borders).
* **Grid Topology**: 4-column compact avatar tile grid on mobile viewports ($\le 480\text{px}$), expanding gracefully to 6 columns on tablet/desktop.
* **Bottom Sheet Drawer**: Slide-up modal with backdrop blur, hero profile, 3 metric progress cards (WR, PR, BR), and Top 3 synergistic partner heroes derived from `data.sub_hero` with positive win-rate delta badges.
* **Client Isolation**: The frontend bundle strictly reads local/origin static JSON (`meta-tierlist.json`) and performs zero runtime API requests to Moonton or third-party proxies.

### 5. Normalized Dataset Schema (Encoded Prototype Decision)
From the prototype and research spikes, the static JSON artifact output format is:
```typescript
interface NormalizedHero {
  id: number;
  name: string;
  avatarUrl: string;
  roles: string[];
  lanes: string[]; // ["EXP Lane", "Roam"]
  winRate: number; // e.g. 0.5795
  pickRate: number; // e.g. 0.0089
  banRate: number; // e.g. 0.1091
  powerScore: number; // e.g. 88.4
  tier: 'S+' | 'S' | 'A' | 'B' | 'C' | 'D';
  synergies: Array<{
    heroId: number;
    name: string;
    avatarUrl: string;
    winRateDelta: number; // e.g. 0.0637 (+6.37%)
  }>;
}

interface TierListDataset {
  updatedAt: string; // ISO 8601
  patchVersion: string; // e.g. "2.1.41"
  rankTier: 'mythic' | 'all';
  timeWindow: '1d' | '7d';
  heroes: NormalizedHero[];
}
```

## Testing Decisions

### Seam Strategy
Testing will focus on external observable behaviors at two high-level seams:
1. **Pipeline Seam (`processHeroTelemetry`)**:
   * **Test Target**: The pure ingestion and scoring function that takes raw GMS/Rone Arena telemetry JSON and hero catalog JSON, normalizes data, applies the mathematical formula and niche dampening, and returns a validated `TierListDataset`.
   * **Behaviors Verified**:
     * Mathematical precision of Min-Max normalization.
     * Correct tier assignment across boundary conditions (85.0, 75.0, 60.0, 45.0, 30.0).
     * Strict application of the niche-pick dampening invariant ($\text{PR} < 0.5\% \implies$ Tier $\le \text{B}$).
     * Multi-lane flex pick assignment.
     * Correct sorting and extraction of Top 3 synergies with positive deltas.
     * Schema validation and graceful error throwing on missing or corrupt raw fields.
2. **Dashboard UI Seam (`<TierListDashboard />`)**:
   * **Test Target**: The React mobile dashboard mounted with a mock `TierListDataset` using React Testing Library.
   * **Behaviors Verified**:
     * Lane tab filtering isolates the correct subset of heroes and displays flex picks in both lanes.
     * Hero search filters the grid by name and displays the empty state with clear button on no match.
     * Ban Priority toggle re-orders hero tiles by descending ban rate.
     * Tapping a hero tile opens the Bottom Sheet drawer and displays exact WR/PR/BR stats and synergy partners.
     * Dismissing the bottom sheet closes the drawer and restores full view.
     * All touch targets meet accessibility criteria.

## Out of Scope

* User authentication, user login, user accounts, and personal match history lookup.
* Real-time WebSocket match tracking or in-game live overlay syncing.
* Interactive custom user tier-maker drag-and-drop generators.
* Pro scene / MPL esports tournament tier lists (this spec strictly covers Ranked Mode matchmaking).
* Item builds, emblem setups, and counter-item recommendations.
* Community comment sections, discussion threads, or upvoting/downvoting systems.

## Further Notes

* **Upstream Courtesy**: As documented in [ADR 0001](docs/adr/0001-direct-gms-ingestion-and-ssg-cache-pipeline.md), Moonton recalculates ranked telemetry only once per 24 hours. The daily cron run consumes fewer than 10 requests per day, preventing any risk of WAF rate-limiting.
* **Domain Vocabulary**: All terminology adheres to [`CONTEXT.md`](CONTEXT.md) (`Hero`, `Power Score`, `Lane`, `Role`, `Flex Pick`, `Synergy / Sub-Hero`, `Niche Pick Dampening`).
* **Prior Art & Working Verification**: Direct Moonton GMS fetch was verified in `prototype/prototype_direct_fetch.mjs` on branch `prototype/direct-rank-fetch` with 100% HTTP 200 repeatability.
