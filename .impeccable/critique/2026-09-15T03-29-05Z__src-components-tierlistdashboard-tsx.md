---
target: hero tier list page
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 1
target_identity: "file:C:\\Users\\Admin\\Documents\\code\\mlbb-tierlist\\src\\components\\TierListDashboard.tsx"
target_fingerprint: "sha256:39cb9897db5b2431ee46a6b63b567cc4d561f748e347af82de78ef9ad83f3b37"
target_path: "C:\\Users\\Admin\\Documents\\code\\mlbb-tierlist\\src\\components\\TierListDashboard.tsx"
timestamp: 2026-09-15T03-29-05Z
slug: src-components-tierlistdashboard-tsx
closed: true
---
Method: dual-agent (A: ses_f5ce5841dffe2AqlXUAYURdUlJ · B: ses_f5ce583d4ffezEgNKDbX32Fi8t)

## Design Health Score (Operate, 25/40 — Acceptable)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | 4px switch bar + 9px gray freshness easy to miss; Pending looks neutral |
| 2 | Match System / Real World | 3 | Lane/ban language maps well; Power Score jargon unexplained |
| 3 | User Control and Freedom | 3 | Reset/Escape/swipe exist; no undo or scroll-restore |
| 4 | Consistency and Standards | 3 | Sticky sheet + segments consistent; rose-ban vs crimson-S+ collide |
| 5 | Error Prevention | 3 | Debounce + race guard + 44px targets; Ban toggle wipes tier view |
| 6 | Recognition Rather Than Recall | 2 | Ban tiles still show WR not BR; benchmark fills need inference |
| 7 | Flexibility and Efficiency | 2 | Novice defaults good; no recents, no collapsible tiers, no / to search |
| 8 | Aesthetic and Minimalist Design | 2 | ~230px chrome + 6 always-rendered bands on 360px |
| 9 | Error Recovery | 3 | Distinct search/lane empties + Retry; copy could be directive |
| 10 | Help and Documentation | 2 | Tier descriptors help; zero Power Score / 1D-vs-7D explainer |
| **Total** | | **25/40** | **Acceptable** |

Prior handoff scored 22/40. Delta +3 reflects drawer/dual-coding credit; structure gaps persist.

## Design Specificity Verdict

**LLM assessment:** Partially authored esports-dark-cyber shell over generic dashboard skeleton. Coherent where it counts: obsidian ground (TierListDashboard.tsx:257), neon tier tokens (TierSection.tsx:19-62), mono telemetry, S+ Must Pick or Ban descriptors, bottom-sheet coaching. Generic breaks: gradient M cube (Header.tsx:36-37), pink spinner + Instagram loading bar (TierListDashboard.tsx:286,295), emoji icons (EmptyState, DraftControls.tsx:133), cyan-vs-purple segments with no Rank/Time semantics. Missed: 30s urgency, ban-threat heat, patch-volatility signal, Mythic prestige. Re-skinnable to stocks by swapping labels.

**Deterministic scan:** `impeccable detect --json` over all 9 components: exit 0, `[]`, 0 findings. Clean per rule engine.

**Detector gaps (manual grep fallback):** 8px power score (HeroTile.tsx:72), 9px hits (HeroTile.tsx:62,72,80; Header.tsx:61), radiogroup without arrow keys (DatasetControls.tsx:41), dialog without focus trap (HeroDetailDrawer.tsx:181), zero aria-live hits. Four mechanical a11y issues from handoff confirmed present.

**Visual overlays:** No overlay — browser automation unavailable in this environment, live-server not started. No user-visible overlay claimed.

## Overall Impression

Competent, shippable, not yet draft-proof. Thumb engineering (44px everywhere, sticky lanes) and drawer payoff are real. First pick below fold + empty-tier scroll tax + ban-mode context loss will cost seconds when timer ticks. Biggest opportunity: collapse chrome and empty tiers so S+ shouts in under 1s.

## What's Working

1. Thumb-first engineering — 44px targets (LaneCarousel.tsx:77, DatasetControls.tsx:60, DraftControls.tsx:100,126, HeroTile.tsx:20), sticky lane bar with roving tabindex + counts. Rare discipline for one-handed draft.
2. Dual-coded tiers — neon badge + text (S+ Must Pick or Ban, TierSection.tsx:80-88) + drawer avatar ring (HeroDetailDrawer.tsx:18-49). Color-blind and sun-glare legible.
3. Drawer payoff — 90vh sheet (HeroDetailDrawer.tsx:180-186) with WR/PR/BR to 2 decimals, benchmark bars, Top-3 synergies +x.xx% WR, partner chaining. Best emotional beat.

## Priority Issues

**[P0] First pick below fold; 4 control rows stack ~230px**
Why: Every 100px costs 2-3s scroll + thumb travel in 30s window. Violates glanceability.
Fix: Single sticky draft bar (compact logo+dot, lanes, expanding search, Ban pill). Move Rank/Time to collapsible row. Freeze S+ header.
Suggested command: /impeccable layout

**[P1] All 6 tier bands always render including empties**
Why: TierListDashboard.tsx:377-384 maps ORDERED_TIERS unconditionally; TierSection.tsx:107-111 filler No heroes in this tier erodes trust during countdown.
Fix: Collapse empties to header-only with 0 count; auto-expand S+/S, gate C/D behind Show situational disclosure.
Suggested command: /impeccable distill

**[P2] Ban Priority destroys tier grouping + shows wrong metric**
Why: TierListDashboard.tsx:342-372 swaps to flat ban-sorted grid, HeroTile.tsx:79-83 still shows WR not BR, no tier chip. Mis-ban risk.
Fix: BR% overlay + mini tier chip in Ban mode; tier-grouped sub-order; 200ms FLIP transition.
Suggested command: /impeccable clarify

**[P3] Telemetry numerals too small for glance**
Why: text-[8px] (HeroTile.tsx:72), text-[9px] (HeroTile.tsx:80, Header.tsx:61) fail arm's length / sunlight.
Fix: WR 11px bold, name 11px, power 10px tier-tinted chip; freshness 10-11px + dot + relative time.
Suggested command: /impeccable typeset

**[P3] Dataset-switch feedback too subtle; freshness untrusted**
Why: 4px pulse bar only (TierListDashboard.tsx:294-299); stale grid stays interactive; Pending reads neutral.
Fix: Dim grid 60% + Updating pill; amber >24h, red Stale-showing-cache.
Suggested command: /impeccable harden

## Persona Red Flags

Casey (distracted mobile, top risk): 8-9px numerals wash in sunlight; top-anchored controls outside thumb arc; CDN stall leaves pulse skeleton with no hero identity.
Alex (power, Mythic Glory): No riser/faller deltas 1D vs 7D; Ban mode discards composite sort; no FLEX chip for multi-lane heroes.
Sam (a11y): Uneven tier contrast (D muted reads disabled); no focus trap, focus not returned to tile; benchmark bars color-only without scale.

## Minor Observations

- Count pill duplicated per tier + ban view; single sticky result count better.
- Placeholder Search heroes... — esports voice + / hint.
- Subtitle Empirical Moonton GMS Meta is insider jargon; Live Moonton data scans faster.
- group-hover:scale-105 needs active:scale-105 for touch.
- backdrop-blur-sm per tier card is GPU-heavy on low-end Android.
- Drag handle undiscoverable; add Swipe down caption first open.
- Rank cyan vs Time purple has no legend.

## Questions to Consider

- If timer hits 5s and only sticky lanes seen, which hero does page argue for — does S+ shout loud enough?
- If ban-threat were hero, would S+ gold survive rose-vs-crimson collision?
- If telemetry freezes 48h mid-patch, does 9px Pending earn trust or need coach confession?
