# 03: Lane Tabs Carousel and Flex-Picks

Type: task  
Status: resolved  
Blocked by: 02  

**What to build:**  
Implement the sticky horizontal thumb-friendly Lane Carousel filter bar, supporting multi-lane flex-pick heroes across lane views.

### Context & References
- Spec: [`.scratch/hero-tierlist/spec.md`](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/.scratch/hero-tierlist/spec.md) (Stories 2, 3, 4, 5, 6, 7, 24)
- Architecture: [ADR 0003: Mobile Web Draft UX & Filter Taxonomy](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/docs/adr/0003-mobile-web-draft-ux-and-filter-taxonomy.md)
- Domain Glossary: [`CONTEXT.md`](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/CONTEXT.md)

---

### Core Requirements

1. **Horizontal Sticky Lane Carousel**:
   - Positioned sticky below the header for thumb reach.
   - Tabs: `All`, `Gold`, `EXP`, `Mid`, `Roam`, `Jungle`.
   - Smooth horizontal scroll on smaller viewports with hidden scrollbars for clean presentation.
   - High-contrast active tab state with neon highlight and clear active indicator.

2. **Touch Target Sizing**:
   - Every tab button must meet or exceed $44 \times 44\text{px}$ touch target dimensions.
   - Generous padding to prevent mis-taps during 30-second draft phases.

3. **Multi-Lane Flex-Pick Inclusion**:
   - Filtering filters heroes by `hero.lanes.includes(selectedLane)`.
   - Heroes with multiple lane assignments (e.g., Chou in `["EXP Lane", "Roam"]`, Julian in `["Jungle", "Mid Lane"]`) must display under both respective lane filters.
   - Tier list grouping (S+ to D) dynamically preserves ordering within the filtered lane subset.

4. **Empty State & Count Badges**:
   - Optional hero count badge per lane (e.g. `Gold (24)`).
   - Instant transition without layout thrashing when switching tabs.

---

### Acceptance Criteria

- [x] Tapping each lane tab (`All`, `Gold`, `EXP`, `Mid`, `Roam`, `Jungle`) filters the tier list to only heroes playable in that lane.
- [x] Flex-pick heroes assigned to multiple lanes appear correctly in all assigned lane views.
- [x] Active tab displays a high-contrast visual state with clear neon indicator.
- [x] Carousel stays accessible while scrolling through long tier lists (sticky positioning).
- [x] All tab touch targets meet the $\ge 44 \times 44\text{px}$ standard.
- [x] Component tests verify lane filtering logic and flex-pick inclusion across multiple lanes.

---

## Answer

Ticket 03 is fully implemented and validated:

1. **Lane Filtering Logic & Utilities (`src/utils/laneFilter.ts`)**:
   - Implemented `isHeroInLane(hero, filter)`, `filterHeroesByLane(heroes, filter)`, and `calculateLaneCounts(heroes)`.
   - Maps shorthand tab labels (`Gold`, `EXP`, `Mid`, `Roam`, `Jungle`) strictly to canonical domain lane names (`Gold Lane`, `EXP Lane`, `Mid Lane`, `Roam`, `Jungle`) without unsafe type casting.
   - Preserves multi-lane flex-pick inclusion: heroes canonically assigned multiple lanes (e.g. Chou in EXP + Roam; Julian in Mid + Jungle) match and display under every assigned lane view.

2. **Horizontal Sticky Lane Carousel (`src/components/LaneCarousel.tsx`)**:
   - Dense, thumb-accessible horizontal scrolling navigation bar with custom hidden scrollbars (`.no-scrollbar` in `src/index.css`).
   - Sticky positioning (`sticky top-0 z-20`) sticks to the top of the mobile viewport when scrolling down through long tier lists.
   - Every tab button strictly adheres to $\ge 44 \times 44\text{px}$ touch target size requirements (`min-h-[44px] min-w-[44px]`, generous padding).
   - Full WAI-ARIA tablist accessibility compliance: canonical `aria-label` names (`All Lanes`, `Gold Lane`, `EXP Lane`, etc.), roving tabindex (`tabIndex={isSelected ? 0 : -1}`), and keyboard navigation (`ArrowLeft`, `ArrowRight`, `Home`, `End`).
   - High-contrast active neon indicator bar (`shadow-[0_0_8px_#06b6d4]`) and hero count badges.

3. **Dashboard Integration & Lane Empty State (`src/components/TierListDashboard.tsx`)**:
   - Integrated `selectedLane` state and dynamic lane filtering while preserving descending Power Score order across S+ to D tier bands.
   - Dedicated lane-level empty state (`<div data-testid="lane-empty-state">`) rendered when a selected lane filter matches zero heroes, with a 1-tap "Reset to All Lanes" button.

4. **Testing & Verification**:
   - Seam 0: 5 unit tests in `tests/components/laneFilter.test.ts` verifying filtering and count calculation.
   - Seam 1: 8 unit tests in `tests/components/LaneCarousel.test.tsx` verifying touch targets, active neon state, count badges, keyboard navigation, and roving tabindex.
   - Seam 2: 9 integration tests in `tests/components/TierListDashboard.test.tsx` verifying lane filtering, multi-lane flex-pick rendering, tier band ordering, and lane empty state recovery.
   - Full test suite: 42 tests passing (12 pipeline, 30 UI). Production build (`npm run build`) succeeds cleanly.

