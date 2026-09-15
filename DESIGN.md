---
name: MLBB Meta Radar
description: Draft war-room tier list — glanceable Moonton-telemetry picks for 30-second ranked drafts.
colors:
  obsidian-ground: "#0b0f19"
  cyber-card: "#131b2e"
  cyber-border: "#1e293b"
  slate-muted: "#94a3b8"
  tier-s-plus: "#ff0055"
  tier-s: "#8b5cf6"
  tier-a: "#06b6d4"
  tier-b: "#10b981"
  tier-c: "#f59e0b"
  tier-d: "#475569"
  ban-badge: "#b91c1c"
  focus-cyan: "#22d3ee"
  win-emerald: "#34d399"
  ban-rose: "#fda4af"
typography:
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "14px"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.01em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.02em"
  mono-data:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: 1.2
    fontFeature: "tnum"
  micro:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "10px"
    fontWeight: 700
    lineHeight: 1.2
    fontFeature: "tnum"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
components:
  badge-tier:
    backgroundColor: "{colors.tier-s-plus}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  hero-tile:
    backgroundColor: "{colors.cyber-card}"
    textColor: "#e2e8f0"
    rounded: "{rounded.md}"
    padding: "4px"
  segment-active:
    backgroundColor: "{colors.cyber-card}"
    textColor: "{colors.focus-cyan}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  search-field:
    backgroundColor: "{colors.cyber-card}"
    textColor: "#f1f5f9"
    rounded: "{rounded.lg}"
    height: "44px"
  ban-badge:
    backgroundColor: "{colors.ban-badge}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  drawer-panel:
    backgroundColor: "{colors.cyber-card}"
    textColor: "#f1f5f9"
    rounded: "16px 16px 0 0"
    padding: "16px"
---

# Design System: MLBB Meta Radar

## Overview

**Creative North Star: "The Draft War-Room"**

A tense, glanceable command surface for the 30-second ranked draft. Obsidian calm keeps the room quiet; a threat spectrum of neon tier accents does the shouting. Every signal — tier, win rate, lane — must land in under a second on a one-handed phone; everything else waits behind a tap in the bottom-sheet dossier.

Telemetry is the authority and the voice stays esports-concise: no hype, no editorial fluff. Density is a feature, not a compromise: four-column hero grids, sticky lane tabs, and 44px thumb targets engineered for mid-draft use beside the live game client.

**Key Characteristics:**
- Dark, quiet room; loud, meaningful tier color.
- Thumb-first: every control meets 44px, primary filters stay in reach.
- Dual-coded tiers: color never travels without its text badge.
- Tactile and confident: springy press states, honest loading and stale signals.

## Colors

A threat spectrum on obsidian: crimson command through purple/cyan/emerald standing to amber caution and slate dismissal.

### Primary
- **War Crimson** (#ff0055): S+ tier only — must pick or ban. Badge, border glow, avatar ring.
- **Mythic Violet** (#8b5cf6): S tier — top meta, high priority. White badge text.
- **Signal Cyan** (#06b6d4): A tier — strong and reliable. Dark badge text. Also the focus/selection accent.

### Secondary
- **Balanced Emerald** (#10b981): B tier — situational picks. Dark badge text. Win-rate numerals (#34d399).
- **Caution Amber** (#f59e0b): C tier — underperforming. Dark badge text. Aging-data dot.
- **Dismissal Slate** (#475569): D tier — avoid in ranked. Recedes by design.

### Tertiary
- **Ban Maroon** (#b91c1c): Ban Priority mode only — deliberately darker than War Crimson so the two reds separate by lightness. Ban-rate numerals in soft rose (#fda4af).

### Neutral
- **Obsidian Ground** (#0b0f19): App canvas and avatar scrims.
- **War-Room Card** (#131b2e): Tiles, sections, drawer, inputs.
- **Hairline Border** (#1e293b): Section and control borders.
- **Muted Slate** (#94a3b8): Secondary copy; never body text on dark.

### Named Rules
**The One Threat Rule.** War Crimson appears only on S+ surfaces. Its rarity is the point — never spend it on decoration, selection, or loading chrome.
**The Two Reds Rule.** Ban Maroon is always darker and flatter than War Crimson; the two never share a screen region without their text labels (S+ vs BAN).

## Typography

**Display Font:** System sans (-apple-system, Segoe UI, Roboto) with sans-serif fallback.
**Body Font:** System sans (same stack).
**Label/Mono Font:** System monospace stack (Tailwind font-mono) with tabular numerals for all telemetry.

**Character:** Condensed confidence — black marquee labels, semibold descriptors, mono numerals that tick like instruments.

### Hierarchy
- **Headline** (900, 14px, tight): App title only. One per screen.
- **Title** (600, 12-14px): Tier descriptors, section labels, drawer headings.
- **Body** (400, 12px, 1.5): Descriptions, empty-state copy, error text.
- **Label** (700, 11px, slight tracking): Hero names, badges, toggles, counts.
- **Mono-Data** (700, 10-11px, tabular): Win/ban rates, power scores, freshness, counts. Never below 10px.
- **Micro** (700, 10px, tabular): Power-score chip, fallback initials, lane counts, drawer microcopy. The absolute floor.

### Named Rules
**The Ten-Pixel Floor Rule.** No glyph ships under 10px; glance-critical numerals sit at 11px bold tabular.
**The Mono Means Data Rule.** Monospace is reserved for measurement (rates, scores, timestamps, counts) — never for voice or decoration.

## Layout

Single-column war-room console: compact brand strip → dataset segments → sticky lane tabs → search/ban row → tier bands. Header and segments scroll away; lane tabs stick. Controls use a tight 4-8px internal rhythm; results separate generously below.

Grid is 4 columns at 360px, 6 at sm, 8 at md with 6px gaps. Containers cap at 64rem centered. Empty tiers collapse to one 44px header row each, expandable in place. Ban Priority swaps grouped bands for a single ban-ordered grid with tier chips on tiles.

## Elevation & Depth

Depth is tonal layering plus surgical glow — never ambient decoration. Surfaces stack obsidian → card → elevated borders; neon glows mark tier meaning (badge shadow, avatar ring, active lane underline).

### Shadow Vocabulary
- **Tier glow** (`0 8px 24px rgba(tier, 0.3)`): S+/S/A/B badges only.
- **Drawer lift** (`0 -8px 40px rgba(0,0,0,0.6)`): bottom sheet over backdrop blur.
- **Active lane underline** (`0 0 8px #06b6d4`): selected tab indicator.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. Glow appears only as tier meaning, selection, or focus — never as fill.

## Shapes

Tight tactical geometry: 6px badges and tags, 8px tiles and buttons, 12px cards and inputs, full pills for counts and status, 16px top radius on the drawer sheet. One consistent 2px SVG stroke for icons; no emoji as iconography on interactive controls.

## Components

### Lane Tabs
- Tactile segmented tabs with counts; sticky under the brand strip. Active: cyan tint fill, cyan underline glow, roving arrow-key navigation.

### Hero Tile
- 8px card, avatar with 1:1 ratio and skeleton shimmer, power chip top-right, rate pill bottom, 11px name. Press: scale-95. Ban mode swaps the pill to ban rate in rose with a tier chip top-left.

### Tier Band
- 12px card with tier-tinted top glow, badge + descriptor header, count pill, 4-8 column grid. Empty bands collapse to a header row.

### Segments (Rank / Window)
- Cyan (rank) and purple (window) active themes with explanatory tooltips; full arrow-key radiogroup support.

### Search + Ban Row
- 44px search field with 1-tap clear; Ban Priority pill with pulsing active dot. Cross-lane dead ends offer "Show All Lanes".

### Drawer Dossier
- 90vh bottom sheet: tier-ringed avatar, exact telemetry to 2 decimals, pool-relative benchmark bars, Top-3 synergy partners with win deltas. Focus-trapped, Escape/swipe/backdrop dismiss, focus returned to the originating tile.

### Status Signals
- Freshness badge: emerald current, amber aging/stale with relative age. Dataset switches dim cached grids to 60% with an "Updating to X · Y" pill and keep an aria-live hero count.

## Do's and Don'ts

### Do:
- **Do** keep every primary control at 44px or larger — the draft happens one-thumbed.
- **Do** pair every tier color with its text badge (S+, BAN, 0 Heroes).
- **Do** dim stale grids and name the incoming dataset during switches.
- **Do** announce result counts via the polite live region on filter changes.

### Don't:
- **Don't** ship type under 10px anywhere, including badges and timestamps.
- **Don't** spend War Crimson outside S+ or let Ban Maroon brighten toward it.
- **Don't** render empty full tier cards by default — collapse to header rows.
- **Don't** show win rate where the mode promises ban rate.
- **Don't** add animation beyond the drawer entrance, press states, and loading pulse.
