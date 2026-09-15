---
target: hero tier list page
total_score: 34
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:C:\\Users\\Admin\\Documents\\code\\mlbb-tierlist\\src\\components\\TierListDashboard.tsx"
target_fingerprint: "sha256:c58529cbd18f4879fbd51024bd3d6d09d4b3e7e48f793f22b90260d008c4c3f4"
target_path: "C:\\Users\\Admin\\Documents\\code\\mlbb-tierlist\\src\\components\\TierListDashboard.tsx"
timestamp: 2026-09-15T09-39-25Z
slug: src-components-tierlistdashboard-tsx
---
Method: dual-agent (A: 3e94b9be-a291-46c2-a5a7-1c6a99c168bb · B: 9d632698-1948-496c-ada6-64ed037f8409)

## Design Health Score (Operate, 34/40 — Good)

| # | Heuristic | Score | Key Issue |
|---|-----------|:---:|---|
| 1 | Visibility of System Status | 3 | `pointer-events-none` freezes interaction during dataset revalidation; synergy partner-hop lacks scroll-to-top & focus |
| 2 | Match System / Real World | 4 | MOBA draft war-room nomenclature firmly established (lanes, roles, S+..D, ban priority) |
| 3 | User Control and Freedom | 3 | Full grid touch freeze locks user during rapid draft switching; no back button in partner-hop |
| 4 | Consistency and Standards | 3 | Ban button uses emoji (`🛡️`) violating DESIGN.md 2px SVG rule; active lane tab uses gradient fill |
| 5 | Error Prevention | 4 | Cross-lane search recovery ("Show All Lanes") prevents false-negative dead ends |
| 6 | Recognition Rather Than Recall | 4 | Dual-coded hero tiles (avatar + name + power score + tier badge) maintain identity in all modes |
| 7 | Flexibility and Efficiency | 3 | Sticky lane tabs, arrow-key radiogroups; dataset segment hints remain desktop `title`-only |
| 8 | Aesthetic and Minimalist Design | 3 | Expanding empty tier row duplicates tier header bar; narrative loading text uses monospace |
| 9 | Error Recovery | 4 | Actionable empty states, error retry, cross-lane reset |
| 10 | Help and Documentation | 3 | Drawer includes pool-relative benchmark explanations; segment tooltips inaccessible on touch |
| **Total** | | **34/40** | **Good** |

Prior runs: 25/40 Acceptable -> 31/40 Good -> 34/40 Good (+3 points: threat differentiation verified, cross-lane recovery confirmed, accessibility foundations solid).

## Design Specificity Verdict

**LLM assessment:** The UI has successfully transitioned from a generic compact analytics dashboard into a purposeful, high-density command surface ("The Draft War-Room"). The obsidian canvas (`#0b0f19`), high-contrast tier badges, compact 4-to-8 column hero grid, and strict 44px thumb touch targets directly support the high-urgency 30-second draft-pick context. The Two Reds Rule is respected (War Crimson for S+ vs Ban Maroon for bans). However, several polish issues degrade the tactical feel: freezing touch interaction during background updates creates friction, OS emojis conflict with the cyber war-room aesthetic, and navigating synergy partners in the drawer leaves the user scrolled to the bottom without focus reset.

**Deterministic scan:** `detect --json` over all 9 component files and scoped passes (`--scope type`, `--scope layout`): exit code 0, `[]` findings across all checks. DESIGN.md design system tokens are cleanly adhered to; no legacy font stacks, no jarring animation easings, and no sub-10px type remain.

**Corroboration & static inspection:**
- Ten-Pixel Floor Rule: 100% compliant. Zero glyphs under 10px.
- Mono Means Data Rule: Minor gaps. Telemetry numerals are tabular mono, but 3 count badges lack `tabular-nums` (`LaneCarousel:88`, `TierSection:152`, `Dashboard:426`), and narrative loading text uses `font-mono`.
- No-Emoji Rule: Violated in `DraftControls.tsx:133` where `🛡️` is used on the Ban button.
- Grid Freeze: `TierListDashboard.tsx:412,450` still contains `pointer-events-none` on updating grids.

**Visual overlays:** None — native browser automation tools are not exposed in this execution harness.

## Overall Impression

The interface has matured into an authentic esports draft companion. The information architecture matches the cognitive pace of ranked drafting, failure states are thoughtfully designed rather than left as dead ends, and accessibility engineering is genuinely production-grade. What holds it back from "Excellent" (36+) is ergonomic friction: locking user touch input during dataset switches, lack of focus management when hopping between synergy partners in the bottom sheet, and an OS emoji that clashes with the cyber aesthetic.

## What's Working

1. **Glanceable Draft-Speed Density**: The 4-column mobile grid displays 8–12 heroes above the fold at 360px without layout shifts, dual-coding every tile with hero portrait, power score, and win/ban rates.
2. **Proactive Cross-Lane Recovery**: When a user filters to a specific lane and searches for a hero assigned elsewhere, the UI presents an intelligent "Show All Lanes" button rather than a dead-end empty state.
3. **Disciplined Threat Hierarchy**: Strict color separation between War Crimson (`#ff0055`) for S+ picks and Ban Maroon (`#b91c1c` / red-700) for ban priority avoids mis-clicks under time pressure.

## Priority Issues

**[P1] Grid Touch-Freeze on Background Dataset Updates**
- **What**: In `TierListDashboard.tsx:412, 450`, updating grids receive `pointer-events-none`.
- **Why it matters**: In a 30-second draft, waiting 300ms for a telemetry revalidation while your thumb is tapping a hero card feels unresponsive and broken.
- **Fix**: Retain `opacity-60 saturate-50` and the "Updating to X · Y" status pill, but remove `pointer-events-none` so hero tiles remain tap-accessible.
- **Suggested command**: `/impeccable harden`

**[P2] Disorienting Synergy Partner-Hop in Detail Drawer**
- **What**: In `HeroDetailDrawer.tsx:399`, tapping a duo partner swaps the hero in place, but does not reset the drawer scroll position to top, does not focus `#drawer-hero-name`, and provides no live announcement.
- **Why it matters**: The user is left looking at the bottom of the drawer (the previous synergy list) with no immediate confirmation of which hero was selected.
- **Fix**: Reset `panelRef.current.scrollTop = 0` on hero change, shift focus to `#drawer-hero-name`, and announce the switch via a polite `aria-live` region.
- **Suggested command**: `/impeccable polish`

**[P3] Emoji Iconography on Interactive Ban Control**
- **What**: `DraftControls.tsx:133` uses OS emoji `<span aria-hidden="true">🛡️</span>` on the Ban Priority toggle.
- **Why it matters**: Violates DESIGN.md Line 180 (no emoji as iconography on interactive controls). Emojis render inconsistently across iOS and Android, clashing with the dark cyber aesthetic.
- **Fix**: Replace the emoji with an inline 2px SVG shield icon matching the search magnifying glass.
- **Suggested command**: `/impeccable shape`

**[P3] Redundant Header on Empty Tier Expansion**
- **What**: In `TierListDashboard.tsx:467-474`, expanding `EmptyTierRow` renders a full `<TierSection tier={tier} heroes={[]} />` directly beneath the row button.
- **Why it matters**: Renders two stacked tier headers with the exact same badge and descriptor, cluttering the mobile view.
- **Fix**: Expand an inline "No heroes in this tier" sub-panel directly inside `EmptyTierRow` without mounting a secondary `TierSection`.
- **Suggested command**: `/impeccable distill`

**[P3] Typographic Discipline (Tabular Numerals & Monospace Rule)**
- **What**: Count badges in `LaneCarousel.tsx:88`, `TierSection.tsx:152`, and `TierListDashboard.tsx:426` lack `tabular-nums`. `TierListDashboard.tsx:334` applies `font-mono` to the loading narrative string.
- **Why it matters**: Missing `tabular-nums` can cause width jitter when counts change, while monospace on narrative copy violates "The Mono Means Data Rule".
- **Fix**: Add `tabular-nums` to count spans; change loading text to sans with `tracking-wider`.
- **Suggested command**: `/impeccable typeset`

## Persona Red Flags

- **Jordan (The 30-Second Shot Caller / Mythic Drafter)**:
  - *Scenario*: Toggles between Mythic and All Ranks with 10s left on the draft timer.
  - *Red Flag*: Grid becomes non-interactive (`pointer-events-none`) while revalidating; Jordan frantically taps an S+ hero card to view counters, but the tap is swallowed.
- **Alex (The Ban-Phase Captain / S5 Pick)**:
  - *Scenario*: Opens Ban Priority mode on mobile to call out priority bans.
  - *Red Flag*: The cartoonish `🛡️` emoji clashes with the esports HUD styling. In the drawer, benchmark bars visually display pool-relative fills (92%), but screen readers announce raw win rates (54%) without percentile context.
- **Riley (The Synergy Hunter)**:
  - *Scenario*: Browsing Claude's drawer, sees Angela (+4.8% WR synergy), taps Angela's card.
  - *Red Flag*: The bottom sheet remains scrolled to the bottom. Focus stays stranded, and Riley has to manually scroll up to see Angela's tier and telemetry.

## Minor Observations

- In `Header.tsx`, `getFreshnessStatus` defines tones `fresh`, `aging`, and `stale`, but both `aging` and `stale` map to `bg-amber-400`. Truly stale data (e.g. >48h) should distinguish itself from aging data.
- In `LaneCarousel.tsx`, the 6th lane ("Jungle") can be partially cut off on 360px screens without a subtle fade affordance hinting that horizontal scrolling is available.

## Questions to Consider

- Should Ban Priority mode retain lane tabs so drafters can quickly filter "Who should we ban in Roam or Jungle?" rather than scanning an all-role list?
- Would replacing desktop HTML `title` tooltips with a discreet info modal or legend drawer give mobile users access to the Composite Power Score weighting?
