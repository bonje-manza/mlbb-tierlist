# Specification: Multi-Hero Live Draft Assistant (Composite Draft Rating)

## Problem Statement
During ranked draft pick (Epic through Mythical Glory), competitive players face an enemy team locking up to 5 heroes under a 30-second turn limit. The existing `CounterView` only evaluates one enemy hero at a time. Players cannot mentally aggregate multiple enemy counter matchups, check teammate synergies, and account for critical team composition balance rules while drafting in real time.

## Background & ADR Reference
- **ADR Reference**: [ADR 0007](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/docs/adr/0007-esports-composite-draft-rating-and-draft-engine.md)
- **Mathematical Model**: Composite Draft Rating (CDR) with Kryptonite Non-Linear Hard-Counter Penalty, Inferred Primary Lane Multipliers, and Composition Hygiene Penalties.

## Core Requirements

1. **Composite Draft Rating (CDR) Engine**:
   - $\mathbf{CDR}(H \mid E, A) = \text{clamp}\Big( \mathbf{PowerScore}(H) + \mathbf{CounterAdvantage}(H, E) + \mathbf{SynergyBonus}(H, A) - \mathbf{CompPenalty}(H, A), 0, 100 \Big)$.
   - Kryptonite Penalty: $\kappa \cdot \max_{e \in E} (\max(0, -\Delta \text{WR} - 3.5))^{1.2}$ with $\kappa = 1.5$.
   - Lane interaction: $1.4\times$ same inferred primary lane, $1.2\times$ roam/jungle vectors, $1.0\times$ cross-lane.
   - Synergy bonus: $0.75 \times \sum_{a \in A} \Delta \text{WR}_{\text{synergy}}(H, a)$.
   - Composition Hygiene: $-8.0$ for $\ge 4$ physical or $\ge 4$ magic; $-15.0$ for missing retribution/jungle at 5 picks; $-10.0$ for duplicate marksmen; $-6.0$ for 0 frontline/tanks.

2. **Draft Assistant View (`DraftView.tsx`)**:
   - Two team rosters: Enemy Team ($0-5$ slots) and Allied Team ($0-4$ slots).
   - 1-tap slot selection to add/replace heroes with search picker.
   - Quick "Remove" (`✕`) button per picked slot.
   - Quick "Reset Draft" button.
   - Real-time Composition Hygiene Diagnosis Badges (e.g. `⚠️ Full Physical`, `✓ Balanced Damage`, `⚠️ No Retribution`).

3. **Recommendation Stack**:
   - Filterable by Lane tabs: `All`, `Gold Lane`, `EXP Lane`, `Mid Lane`, `Roam`, `Jungle`.
   - Card layout displaying:
     - Hero portrait, name, and primary/flex lanes.
     - Final **CDR Score** ($0 - 100$) with color-coded badge.
     - Advantage Breakdown: $\sum \Delta \text{WR}$ vs enemy team, $\sum \text{Syn}$ with allies.
     - Fatal Counter Alert pill if Kryptonite penalty triggered (e.g. `⚠️ Hard countered by Phoveus (-7.8%)`).
   - Pick Exclusivity: Locked heroes cannot appear in recommendations.

4. **URL & Navigation Integration**:
   - Top Header view switcher: `Tier List` | `Counter Picks` | `Draft Assistant`.
   - URL Sync: `?view=draft&enemy=1,14,35&ally=54,88`.
   - Full browser reload restoration.
