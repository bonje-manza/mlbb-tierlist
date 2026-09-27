# Domain Context & Glossary: MLBB Hero Tier List

This document defines the core domain concepts, glossary, architecture boundaries, and invariants for the Mobile Legends: Bang Bang (MLBB) Hero Tier List. All engineering skills, documentation, and tickets must adhere to the vocabulary defined here.

---

## 1. Glossary of Domain Concepts

### Telemetry & Match Statistics
* **Hero**: A playable character in Mobile Legends: Bang Bang, uniquely identified by an integer `HeroId` (e.g. `1` for Miya, `14` for Rafaela, `134` heroes total).
* **Win Rate (`WR`)**: The ratio of ranked matches won by a hero divided by total ranked matches featuring that hero: $\text{WR} \in [0.0, 1.0]$.
* **Pick Rate (`PR`)** (also referred to by Moonton GMS as **Appearance Rate**): The percentage of ranked matches where the hero was selected by any player: $\text{PR} \in [0.0, 1.0]$.
* **Ban Rate (`BR`)**: The percentage of draft-pick ranked matches where the hero was banned during the banning phase: $\text{BR} \in [0.0, 1.0]$.
* **Synergy / Sub-Hero**: Pairwise hero relationship telemetry provided by Moonton GMS (`data.sub_hero`), measuring the increase in win rate (`increase_win_rate`) when two specific heroes are on the same team, or for head-to-head matchups when evaluating counters.
* **Viable Counter**: A counter hero whose positive win-rate shift (`increase_win_rate`) against a specific main hero exceeds a statistically significant threshold (e.g., >1.0 percentage points).
* **Power Score**: The composite scalar index ($\in [0, 100]$) calculated from min-max normalized Win Rate (50%), Pick Rate (25%), and Ban Rate (25%), used to rank heroes into tiers.
* **Power Score Weights**: The relative weighting factors $(W_{\text{WR}}, W_{\text{PR}}, W_{\text{BR}})$ applied to normalized hero telemetry ($w_i \in [0.0, 1.0]$, summing to $1.0$). Default: $0.50 \text{ WR}, 0.25 \text{ PR}, 0.25 \text{ BR}$.
* **Custom Power Score**: A power score calculated on the client using user-modified weights rather than default baseline weights.
* **Weight Preset**: A pre-packaged set of weights tailored to specific competitive lenses (e.g. Balanced Default, Pure Win Rate, Ban Priority / Tournament, High Popularity).
* **Tier Bucket**: Discrete qualitative competitive classification assigned by Power Score:
  * **S+ Tier (God Tier / Must Pick or Ban)**: $\text{PowerScore} \ge 85$
  * **S Tier (Top Meta / High Priority)**: $75 \le \text{PowerScore} < 85$
  * **A Tier (Strong & Reliable)**: $60 \le \text{PowerScore} < 75$
  * **B Tier (Balanced / Situational)**: $45 \le \text{PowerScore} < 60$
  * **C Tier (Underperforming)**: $30 \le \text{PowerScore} < 45$
  * **D Tier (Weak / Avoid in Ranked)**: $\text{PowerScore} < 30$

### Competitive Draft Engine & In-Draft Intelligence
* **Composite Draft Rating (CDR)**: The multi-factor draft suitability score ($\in [0, 100]$) calculating real-time pick value against a specific enemy composition and allied pairing set (ADR 0007).
* **Kryptonite Penalty**: An asymmetric, non-linear penalty applied to a candidate hero's draft rating when an enemy has locked a severe hard counter ($> 3.5\text{ pp}$ empirical disadvantage), preventing naive linear averaging from masking unplayable fatal matchups.
* **Inferred Primary Lane**: The primary lane assignment derived canonically from the first entry in the hero's lane array (`lanes[0]`), used to calculate lane interaction weights ($\omega_{\text{lane}} = 1.4\times$).
* **Composition Hygiene**: Structural team balance rules penalizing defects during live drafting (e.g. damage monoculture, zero frontline/tanks, lack of Retribution/Jungler).
* **Draft Assistant**: Interactive multi-slot draft recommendation engine assisting players during the 30-second drafting phase.

### Gameplay Roles & Lanes
* **Lane**: The strategic map lane assignment. Canonical options:
  * `Gold Lane` (Marksmen / late-game physical damage dealers, `roadid: 5`)
  * `EXP Lane` (Off-laners / durable fighters / split pushers, `roadid: 1`)
  * `Mid Lane` (Mages / wave clear / fast rotators, `roadid: 2`)
  * `Roam` (Tanks / Supports / utility initiators, `roadid: 3`)
  * `Jungle` (Assassins / objective secure / retribution carriers, `roadid: 4`)
* **Flex Pick**: A hero that canonically supports multiple lane assignments (e.g., Chou in EXP Lane and Roam; Edith in EXP Lane and Roam). Flex picks are included under all corresponding lane tabs.
* **Role**: The combat classification: `Tank` (`1`), `Fighter` (`2`), `Assassin` (`3`), `Mage` (`4`), `Marksman` (`5`), `Support` (`6`).

### Upstream Infrastructure & Ingestion
* **Moonton GMS**: Moonton Game Management System backend (`https://api.gms.moontontech.com`), hosting official unauthenticated internal telemetry endpoints.
* **Enigma**: The dynamic cryptographic HMAC key retrieved from `/api/act/basev4` (`data.server.enigma`) used to sign GMS data queries.
* **Source ID**: Moonton telemetry endpoint identifier specifying the aggregation time window:
  * `2756567`: Past 1 Day
  * `2756568`: Past 3 Days
  * `2756569`: Past 7 Days
  * `2756565`: Past 15 Days
  * `2756570`: Past 30 Days
* **Rank Tier Filter (`bigrank`)**: Upstream filter parameter:
  * `"7"`: Mythic (default competitive ranking for tier list)
  * `"101"`: All Ranks
  * `"5"`: Epic | `"6"`: Legend | `"8"`: Mythical Honor | `"9"`: Mythical Glory+
* **Rone Arena**: Open-source community REST API wrapper (`https://arena.rone.dev`), used as the secondary automatic failover tier.
* **Airgap Snapshot**: The last validated static JSON dataset retained locally to ensure zero-downtime serving if all upstream endpoints fail.

---

## 2. Architecture & Data Flow

```
[ Moonton GMS API ] (Primary)
         │
         ├──(Fails?)──► [ Rone Arena API ] (Secondary Failover)
         │                       │
         ▼                       ▼
[ Daily GitHub Actions Ingestion Job (01:00 UTC) ]
         │
         ├──(Both Fail?)──► [ Airgap Local JSON Snapshot ] (Tertiary)
         │
         ▼
[ Normalization & Power Score Engine (ADR 0002) ]
         │
         ▼
[ Static Build Artifact: meta-tierlist.json ]
         │
         ▼
[ Mobile Web SPA (Vite + React + Tailwind CSS) (ADR 0003) ]
         │
         ▼
[ Ranked Player (Mobile Browser during Draft) ]
```

---

## 3. Invariants & Rules

1. **Client Isolation**: The browser application must NEVER make direct network calls to `api.gms.moontontech.com` or third-party APIs. All telemetry is pre-compiled into static JSON build artifacts.
2. **Upstream Courtesy**: Scheduled cron ingestion runs at most twice daily. Upstream GMS recalculates data only once every 24 hours.
3. **Niche Pick Dampening**: By default, a hero with Pick Rate $< 0.5\%$ cannot enter S+ Tier and is capped at B Tier. Users may explicitly toggle this rule when customizing power score weights (ADR 0005).
4. **Lane Fidelity**: Lane classifications must be sourced from canonical hero metadata (`en_hero_list.json`). Flex picks appear in all assigned lanes.
5. **Data Freshness Disclosure**: The mobile UI must always render the UTC timestamp of the underlying data snapshot (`Data updated: YYYY-MM-DD HH:mm UTC`).
6. **Deterministic Dynamic Recalculation**: Client-side weight modifications must dynamically recalculate Power Score across all active heroes using Min-Max normalized values derived from the active dataset pool without external network requests (ADR 0005).
7. **Draft Pick Exclusivity**: Any hero selected in either the enemy team ($E$) or allied team ($A$) is strictly ineligible for selection and excluded from candidate recommendations in the Draft Assistant (ADR 0007).
8. **Competitive Draft Baseline**: In-draft composite counter calculations default to the Mythic rank tier telemetry as the canonical competitive baseline (ADR 0007).

---

## 4. Architectural Decision Records (ADRs)
* [ADR 0001: Direct GMS Ingestion & SSG Cache Pipeline](docs/adr/0001-direct-gms-ingestion-and-ssg-cache-pipeline.md)
* [ADR 0002: Composite Power Score & Tier Assignment Formula](docs/adr/0002-composite-power-score-and-tier-assignment-formula.md)
* [ADR 0003: Mobile Web Draft UX & Filter Taxonomy](docs/adr/0003-mobile-web-draft-ux-and-filter-taxonomy.md)
* [ADR 0004: Full Ladder Rank & Multi-Window Telemetry Ingestion and UI Controls](docs/adr/0004-full-ladder-rank-and-multi-window-telemetry.md)
* [ADR 0005: Client-Side Custom Power Score Weighting & Presets](docs/adr/0005-custom-power-score-weighting.md)
* [ADR 0006: Counter Picks Data Ingestion via Moonton GMS](docs/adr/0006-counter-picks-data-ingestion-via-gms.md)
* [ADR 0007: Esports Composite Draft Rating (CDR) & In-Draft Engine](docs/adr/0007-esports-composite-draft-rating-and-draft-engine.md)

