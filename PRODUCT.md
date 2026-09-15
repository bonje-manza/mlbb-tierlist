# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite + React + Tailwind CSS

## Users

Competitive MLBB ranked players (Epic through Mythical Glory+) using mobile web browsers on smartphones (360px–420px viewports) during active draft-pick phases. Their job is to rapidly evaluate hero meta standing, lane match-ups, win/pick/ban percentages, and synergistic teammates within the 30-second draft timer.

## Product Purpose

Deliver an ultra-fast, zero-latency, glanceable mobile hero tier list backed directly by official Moonton telemetry, eliminating guesswork and out-of-date community tier lists during high-stakes ranked drafting. Success means a player can open the app, tap their lane, and select an optimal meta hero or identify high-priority bans in under 10 seconds.

## Positioning

The only MLBB tier list powered directly by daily Moonton Game Management System (GMS) telemetry and an unskewed Composite Power Score (accounting for win rate, pick rate, and ban rate), providing verified pairwise synergy deltas without intrusive ads, paywalls, or third-party proxy lag.

## Operating Context

- **Usage Environment**: Mobile smartphones held in portrait orientation with one hand, often toggled rapidly alongside or during the MLBB game client loading and draft screens.
- **Time Constraint**: High urgency (~30s pick window); requires instant, thumb-driven tab switching without layout shifts or sluggish transitions.
- **Network Conditions**: Mobile cellular or Wi-Fi; requires tiny static initial payload (<50KB gzip) and offline-capable cached snapshots.

## Capabilities and Constraints

- **Capabilities**:
  - Six lane tabs (`All`, `Gold Lane`, `EXP Lane`, `Mid Lane`, `Roam`, `Jungle`) with multi-lane flex-pick inclusion.
  - Six discrete tier classifications (`S+`, `S`, `A`, `B`, `C`, `D`) computed via Min-Max normalized Composite Power Score (50% WR, 25% PR, 25% BR) with sub-0.5% niche pick dampening.
  - Instant debounced hero search bar.
  - Quick toggle between Mythic (default) and All Ranks, and 1-Day vs 7-Day aggregation windows.
  - Interactive bottom-sheet hero detail drawer presenting exact telemetry percentages and Top 3 synergistic partner heroes (`sub_hero` with `increase_win_rate`).
- **Constraints**:
  - Zero direct client-to-Moonton network calls; strictly consumes static JSON build artifacts.
  - No external database or long-running backend server; deployed via Static Site Generation (SSG) with GitHub Actions cron.
  - High-speed direct image loading from Moonton CDN (`akmweb.youngjoygame.com`) with local SVG placeholder fallbacks.

## Brand Commitments

- **Tone & Aesthetic**: Competitive Esports / MOBA Dark Cyber. Deep obsidian/navy foundation (`#0b0f19`), high-contrast glowing neon tier accents (S+ gold/crimson, S vibrant purple, A cyan, B emerald, C amber, D muted slate), sharp clean typography, and purposeful micro-interactions.
- **Voice**: Authoritative, data-backed, concise, and esports-focused. No clickbait or subjective editorial fluff.

## Evidence on Hand

- Canonical Telemetry Specification: `.scratch/research/mlbb-data-source.md`
- Prototype Validation: `prototype/prototype_direct_fetch.mjs` on branch `prototype/direct-rank-fetch`
- Architectural Decision Records:
  - `docs/adr/0001-direct-gms-ingestion-and-ssg-cache-pipeline.md`
  - `docs/adr/0002-composite-power-score-and-tier-assignment-formula.md`
  - `docs/adr/0003-mobile-web-draft-ux-and-filter-taxonomy.md`
- Canonical Domain Glossary: `CONTEXT.md`

## Product Principles

1. **Draft-Speed Glanceability**: Every crucial signal (tier, winrate, lane) must be legible in under a second; secondary details live in the bottom sheet.
2. **Empirical Truth Over Hype**: Tiers reflect mathematical performance across thousands of ranked matches, not streamer opinion or subjective bias.
3. **Frictionless Thumb Reach**: All primary filter tabs, search inputs, and cards must sit within comfortable one-handed mobile thumb zones.
4. **Resilient Simplicity**: The interface must load instantly and remain functional even on spotty cellular connections.

## Accessibility & Inclusion

- High visual contrast ratios (WCAG AA compliant) across all tier badges and text elements against the dark obsidian background.
- Touch targets for tabs, search, and cards meet or exceed 44x44px.
- Visible text labels alongside all color-coded tier indicators so color is never the sole information carrier.
