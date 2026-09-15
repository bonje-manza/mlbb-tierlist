---
target: hero tier list page
total_score: 31
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:C:\\Users\\Admin\\Documents\\code\\mlbb-tierlist\\src\\components\\TierListDashboard.tsx"
target_fingerprint: "sha256:8fbd91ebb958fb3d04b24c210a757d3dc1ea161e70003c26c7a315b624578579"
target_path: "C:\\Users\\Admin\\Documents\\code\\mlbb-tierlist\\src\\components\\TierListDashboard.tsx"
timestamp: 2026-09-15T04-04-55Z
slug: src-components-tierlistdashboard-tsx
---
Method: dual-agent (A: ses_f5cc5192effeRmIXnm6WBzk75R · B: ses_f5cc51919ffeIGtG2kmJrDaNMw)

## Design Health Score (Operate, 31/40 — Good)

| # | Heuristic | Score | Key Issue |
|---|-----------|:---:|---|
| 1 | Visibility of System Status | 3 | Pill + dim + aria-busy + aged freshness; unreachable `stale` tone, pink loading chrome |
| 2 | Match System / Real World | 4 | War-room metaphor lands end-to-end; hover-only explanations docked but absorbed by adjustment |
| 3 | User Control and Freedom | 3 | Expandable empties, multi-dismiss drawer; grid freeze + partner-hop focus |
| 4 | Consistency and Standards | 3 | Palette/pairings disciplined; monochrome ban chips, cyan double-duty |
| 5 | Error Prevention | 3 | Cross-lane recovery, debounce; lane-join copy lacks count preview |
| 6 | Recognition Rather Than Recall | 3 | Tier chips persist as text in ban mode; color strip + formula hover-only |
| 7 | Flexibility and Efficiency | 3 | Sticky tabs, arrow-key groups; `no-scrollbar` hides overflow, cramped 360px segments |
| 8 | Aesthetic and Minimalist Design | 4 | Empty-collapse + chrome diet is a visible leap; redundant expanded card, ban-toggle emoji |
| 9 | Error Recovery | 3 | Action-bearing empties, retry; generic lane-empty copy |
| 10 | Help and Documentation | 2 | `title`-only tooltips invisible on touch; pool-relative bars undocumented |
| **Total** | | **31/40** | **Good** |

Prior run: 25/40 Acceptable. Scored 29 fresh, +1 H2 (war-room lands) +1 H8 (collapse + chrome diet) = 31.

## Design Specificity Verdict

**LLM assessment:** Reads as the war-room now — obsidian canvas, threat-spectrum bands with tinted glow, sticky cyan-underline lanes, BAN-maroon panel, mono instruments, 44px targets, collapsed empties. Three breaks from DESIGN.md as written: (a) War Crimson leaks into chrome — pink spinner, pink loading gradient, pink-amber brand mark vs One Threat Rule; (b) ban-mode tier chips monochrome — spectrum stripped where stakes peak; (c) `title`-only tooltips fail the explanatory contract on touch-first.

**Deterministic scan:** `detect --json` full + `--scope type` + `--scope layout` over all 9 components: exit 0, `[]` on every scope. Zero design-system advisories — DESIGN.md micro role covers the 10px floor.

**Corroboration (rg):** zero `text-[8px]/[9px]`; `aria-live` present (TierListDashboard.tsx:324); `EmptyTierRow` wired (TierSection.tsx:64,75; Dashboard:7,462); `metric="banRate"` (Dashboard:438); `getFreshnessStatus` (Header:32,56).

**Visual overlays:** None — browser automation unavailable, live-server not started.

## Overall Impression

A credible draft console. Scan path matches the 30s job; failure paths are designed, not decorated. What blocks excellent is last-mile meaning: tier color dies in ban mode, threat hues leak into chrome, and the knowledge layer is a hover secret on a phone. All surface work — nothing structural.

## What's Working

1. **Threat spectrum disciplined** — config hex matches PRODUCT/DESIGN to the digit, contrast-sane pairings, Two Reds separated by lightness with text labels.
2. **Failure paths designed** — cross-lane Show All Lanes with named lanes, typed empties, retry, dimmed-stale with incoming-dataset naming.
3. **Real a11y engineering** — roving radiogroups, tablist arrows, focus trap + return, live-region counts, aria-busy, 44px throughout.

## Priority Issues

**[P1] Ban-mode tier chips are monochrome**
Why: Ban #1 being S+ vs B is the whole decision; text-without-color halves the code at peak stakes.
Fix: Color chip per tier (badge bg + pairing text, 10px floor kept); keep BAN panel maroon.

**[P1] Knowledge layer is hover-only on touch-first**
Why: `title` never fires on 360-420px touch; Power Score formula unreachable where PRODUCT demands <10s evaluation.
Fix: Tap-accessible disclosure (info affordance / drawer-anchored legend), visible segment hint via aria-describedby.

**[P2] Threat hues leak into non-S+ chrome**
Why: Pink spinner/gradient/brand mark trains the eye to discount red, dulling the S+ shout (One Threat Rule).
Fix: Loading chrome to cyan/violet, brand mark violet→cyan; reserve pink family for S+.

**[P2] Grid freeze + partner-hop strands focus**
Why: `pointer-events-none` freeze reads as broken in a 30s window; SR users hopping synergies hear nothing.
Fix: Dim only, keep interactive; move focus to drawer heading + announce on partner select.

**[P3] Polish cluster**
tabular-nums on three count pills; redundant expanded-empty card; unreachable `stale` tone; ban-toggle/EmptyState emoji vs no-emoji rule (inline SVG); benchmark aria-valuetext needs pool context.

Cognitive load: 2/8 failures (mode clarity, interruption recovery) — low-moderate.

## Persona Red Flags

- **Alex (one-handed Mythic grinder, 360px):** four 44px segments crammed `justify-between` with no wrap — mis-taps flip rank+window together; grid freeze eats switch-back seconds.
- **Jordan (color-vision-deficient, badge-reliant):** ban mode removes the redundant color channel where tiles are densest; cyan double-duty (A-tier vs focus) forces position-based disambiguation.
- **Sam (TalkBack/keyboard-only):** partner-hop swaps heroes with no focus reset or announcement; benchmark bars announce absolute values against pool-relative fills.

## Minor Observations

Updating-pill dataset names set in mono (borderline vs Mono-Means-Data); `no-scrollbar` hides lane overflow (needs fade/peek); `sm:text-[10px]` no-op duplicate on power chip; search role + 150ms debounce well-judged.

## Questions to Consider

- Should ban mode be the most saturated surface, not the least — monochrome board with colored chips, or full-spectrum threat board?
- If Power Score were a visible instrument (tap-to-explain + pool-relative labels), would players trust S+ faster or argue more?
- In a real 30s draft: act on dimmed-stale data with one-tap undo, or block interaction until fresh?
