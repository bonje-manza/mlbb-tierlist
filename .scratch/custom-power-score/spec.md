# Spec: Custom Power Score Weighting & Presets

Status: ready-for-agent

## Problem Statement

Players in Mobile Legends: Bang Bang evaluate meta strength differently depending on their competitive intent. A solo queue player climbing ranked wants to know which heroes reliably win games regardless of popularity (Win Rate focus). A tournament team captain or draft shot-caller needs to prioritize heroes that opposing teams consistently fear and ban (Ban Rate focus). Meanwhile, casual players prefer widely accepted, popular picks that fit seamlessly into diverse team compositions (Pick Rate focus).

Currently, the MLBB Tier List applies a fixed weight formula (50% Win Rate, 25% Pick Rate, 25% Ban Rate) and a mandatory niche-pick dampening rule (capping heroes with $<0.5\%$ pick rate at B tier). While statistically balanced, players cannot adjust these parameters to match their specific drafting philosophy or experiment with alternative competitive lenses, limiting the tool's flexibility.

## Solution

Empower players with full control over the Power Score calculation directly within the mobile web client:
1. **Interactive Weight Tuning Drawer**: A native mobile bottom sheet with 3 intuitive sliders (Win Rate, Pick Rate, Ban Rate) allowing continuous 0–100 adjustments that dynamically compute relative percentage weights.
2. **One-Tap Competitive Presets**: 4 curated presets (`Default Meta`, `Pure Win Rate`, `Ban Priority`, `High Popularity`) that let players switch their analytical lens instantly during a 30-second draft countdown.
3. **User-Controlled Niche Pick Dampening**: A toggle allowing players to decide whether low-sample niche picks ($<0.5\%$ pick rate) are capped at B Tier or allowed to reach S+ Tier based strictly on performance.
4. **Instant In-Memory Recalculation**: Recomputes all 133 hero power scores, tier assignments, and sorting in $<2\text{ms}$ on the client without network requests.
5. **Dual Persistence & URL Sharing**: Preserves user weight preferences in local storage across browser visits and serializes active weights into shareable URL parameters.
6. **Glanceable Transparency**: An active indicator badge in the control bar displaying the current weight formula with a 1-tap reset action to immediately restore the official ADR 0002 baseline.

## User Stories

1. As a ranked player, I want to tap a "Weights" button in the control bar, so that I can open the weight configuration drawer without navigating away from the tier list.
2. As a player inspecting the drawer, I want to see the 3 sliders for Win Rate, Pick Rate, and Ban Rate initialized to their default values (50%, 25%, 25%), so that I understand the official baseline.
3. As a player dragging any slider from 0 to 100, I want to see live percentage badges updating in real time, so that I immediately understand each metric's relative contribution to the final power score.
4. As a player who sets all three sliders to zero, I want the system to gracefully fallback to the default 50/25/25 distribution, so that the tier list never breaks or displays NaN scores.
5. As a player who adjusts sliders, I want the tier list in the background and upon closing the drawer to immediately re-rank heroes, recalculate power scores, and re-bucket tiers, so that I see the consequences of my formula in real time.
6. As a solo carry who wants to evaluate raw win rates, I want to tap a "Pure Win Rate" preset button, so that Win Rate is instantly set to 100% and Pick/Ban rates to 0%.
7. As a player in a draft tournament, I want to tap a "Ban Priority" preset button, so that Ban Rate is weighted at 50% and Win/Pick rates at 30%/20%.
8. As a casual player, I want to tap a "High Popularity" preset button, so that Pick Rate is prioritized at 50% alongside 40% Win Rate and 10% Ban Rate.
9. As a player who made extensive custom modifications, I want a 1-tap "Reset to Default" button, so that I can immediately revert all weights and dampening settings back to the official meta standard.
10. As an analyst who wants to see how 56% win-rate niche picks rank unfiltered, I want to uncheck "Cap niche picks (<0.5% PR) at B Tier", so that low-sample heroes can legitimately enter S+ or S tier if their calculated power score warrants it.
11. As a player returning to the main dashboard with custom weights active, I want to see an active indicator chip in the control bar (e.g., "Custom Formula: 70/15/15"), so that I never forget that I am looking at customized rather than official rankings.
12. As a player who wants to quickly return to official rankings from the dashboard, I want to tap a small `✕` icon on the custom formula chip, so that my weights reset to default in a single tap without opening the drawer.
13. As a player switching between rank filters (e.g. Mythic to Legend) or time windows (1 Day to 7 Days), I want my custom weights to remain active and automatically recalculate against the new dataset, so that I can compare ranks using my preferred formula.
14. As a player closing and reopening the browser on mobile, I want my custom weights to be remembered in local storage, so that I do not have to reconfigure them every session.
15. As a content creator or team captain sharing a customized tier list, I want the active weights to sync to the browser URL (e.g., `?wr=70&pr=15&br=15&dampen=0`), so that anyone opening my link sees the exact same customized power scores and tiers.
16. As a user opening a shared link with custom weight parameters, I want the app to automatically apply those weights and display the custom formula indicator, so that I know I am viewing a shared customized tier list.

## Implementation Decisions

### 1. Pure Calculation Module
- A dedicated functional recalculation utility that takes a hero dataset, three relative weight numbers ($W_{\text{WR}}, W_{\text{PR}}, W_{\text{BR}}$), and a boolean dampening flag (`dampenNiche`).
- Computes min and max bounds for Win Rate, Pick Rate, and Ban Rate across the hero pool.
- Derives normalized percentages:
  $$w_i = \frac{W_i}{\sum W} \quad (\text{or default } 0.50, 0.25, 0.25 \text{ if } \sum W == 0)$$
- Normalizes raw metrics into $[0, 100]$ space, computes the composite power score rounded to 1 decimal, assigns tier buckets according to standard thresholds ($85, 75, 60, 45, 30$), and applies niche pick dampening conditionally based on `dampenNiche`.
- Returns a new immutable dataset sorted by descending power score and win rate.

### 2. Weight Configuration Model
- Data structure:
  ```typescript
  export interface PowerScoreWeights {
    wr: number; // 0 - 100
    pr: number; // 0 - 100
    br: number; // 0 - 100
    dampenNiche: boolean; // default true
  }
  ```
- Preset definitions:
  - `default`: `{ wr: 50, pr: 25, br: 25, dampenNiche: true }`
  - `pure_winrate`: `{ wr: 100, pr: 0, br: 0, dampenNiche: false }`
  - `ban_priority`: `{ wr: 30, pr: 20, br: 50, dampenNiche: true }`
  - `popularity`: `{ wr: 40, pr: 50, br: 10, dampenNiche: true }`

### 3. Mobile UI Component: Weight Tuning Drawer
- A slide-up mobile sheet built with native touch handling and backdrop dismissal.
- Preset pill selector for 1-tap quick configurations.
- Accessible `<input type="range">` elements styled with neon accent fill and digital percentage readout badges.
- Toggle switch for Niche Pick Dampening with explanatory caption.
- Sticky footer containing "Reset to Default" and "Apply" buttons.

### 4. Integration with Dashboard & Controls
- A "Weights" button integrated into the draft controls bar beside "Ban Priority".
- When custom weights deviate from default (50/25/25 with dampening true), the button displays an active border/pill highlight, and an inline chip appears with a 1-tap dismiss/reset button.
- Re-scoring is memoized with `useMemo` so sliding or toggling updates the 133 heroes instantaneously.

### 5. Local Storage & URL Parameter Synchronization
- Local storage key: `mlbb_power_score_weights`.
- URL parameters: `wr`, `pr`, `br`, `dampen`.
- URL priority on load: if URL query parameters exist, they take priority; otherwise local storage; otherwise default.

## Testing Decisions

### What Makes a Good Test
Tests should verify external behavioral invariants without depending on internal UI component layout details:
1. Relative normalization math: verify that arbitrary inputs (e.g., 80/50/50) yield identical scores to their simplified ratio equivalents.
2. Degenerate fallback: verify that setting all weights to 0 produces the exact default 50/25/25 power scores and does not produce `NaN`.
3. Dampening toggle: verify that when `dampenNiche: true`, a hero with $PR < 0.005$ and high $WR$ is capped at B Tier; when `dampenNiche: false`, the same hero reaches S+ Tier.
4. Preset application: verify each preset accurately sets weights and dampening flags.
5. URL & Local Storage persistence: verify serialization and hydration logic.

### Modules to Test
- `tests/scoring.test.ts`: Unit tests for dynamic power score calculation, weight normalization, and tier reassignment.
- `tests/components/weightControls.test.ts`: Integration tests for drawer interactions, slider inputs, preset switching, reset actions, and local storage syncing.

### Prior Art
- `tests/scoring.test.ts`: Existing test suite validating `calculatePowerScore`, `assignTier`, and telemetry normalization.
- `tests/components/draftFilter.test.ts`: Existing test suite validating search filtering and ban-priority sorting.

## Out of Scope
- Backend GMS sync script modification: the upstream build artifacts continue to store the canonical raw stats and default power scores.
- Dynamic tier threshold sliders: tier cutoffs remain anchored at $85, 75, 60, 45, 30$ to preserve semantic meaning of S+, S, A, B, C, D across formulas.
- Custom synergy formula weights: synergy win rate delta is an independent metric and is not affected by power score weights.

## Further Notes
- The calculation is completely synchronous and pure, executing in $<2\text{ms}$ on modern mobile browsers.
- The UI maintains the linear-minimalist aesthetic and authentic Geist typography established in recent design updates.
