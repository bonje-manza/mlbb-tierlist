# 03: Lane Tabs Carousel and Flex-Picks

Type: task  
Status: ready-for-agent  
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

- [ ] Tapping each lane tab (`All`, `Gold`, `EXP`, `Mid`, `Roam`, `Jungle`) filters the tier list to only heroes playable in that lane.
- [ ] Flex-pick heroes assigned to multiple lanes appear correctly in all assigned lane views.
- [ ] Active tab displays a high-contrast visual state with clear neon indicator.
- [ ] Carousel stays accessible while scrolling through long tier lists (sticky positioning).
- [ ] All tab touch targets meet the $\ge 44 \times 44\text{px}$ standard.
- [ ] Component tests verify lane filtering logic and flex-pick inclusion across multiple lanes.
