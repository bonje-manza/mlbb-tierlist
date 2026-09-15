# 04: Debounced Search and Ban Priority Sort

Type: task  
Status: resolved  
Blocked by: 02  

**What to build:**  
Implement instant debounced hero search with a 1-tap clear button, an empty state fallback, and a dedicated "Ban Priority" quick-sort toggle pill for draft ban phases.

### Context & References
- Spec: [`.scratch/hero-tierlist/spec.md`](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/.scratch/hero-tierlist/spec.md) (Stories 8, 9, 10, 24)
- Architecture: [ADR 0003: Mobile Web Draft UX & Filter Taxonomy](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/docs/adr/0003-mobile-web-draft-ux-and-filter-taxonomy.md)
- Domain Glossary: [`CONTEXT.md`](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/CONTEXT.md)

---

### Core Requirements

1. **Debounced Search Bar**:
   - Compact search input placed in the draft control bar next to the Ban Priority toggle.
   - 150ms debounce on keystrokes to ensure zero UI stutter on mobile devices.
   - Case-insensitive substring matching against `hero.name`.
   - Clear icon button (`X`) rendered when the search bar contains text, clearing the input in 1 tap.

2. **Empty Search State**:
   - Clean, non-disruptive empty state component displayed when query matches zero heroes.
   - Includes message (e.g., "No heroes found matching \"...\"") and a direct "Reset Search" button to quickly restore full view.

3. **Ban Priority Quick-Sort Toggle**:
   - Quick-toggle pill button (e.g., "🛡️ Ban Priority" or "Ban Rate") positioned directly in the draft controls.
   - When inactive: Grid groups heroes by Tier (S+ to D) ordered by Composite Power Score.
   - When active: Grid reorders all visible heroes strictly by descending Ban Rate (`banRate`), surfacing high-priority bans at the very top of the screen during draft ban phase.
   - Prominent active state indicator (e.g., red/neon warning accent with active dot).

4. **Composition with Lane Filters**:
   - Search and Ban Priority compose seamlessly with active Lane filters (e.g. "Roam Lane" + "Ban Priority" shows highest-ban roamer tanks first).

---

### Acceptance Criteria

- [x] Typing in the search input updates the visible hero grid with 150ms debounce.
- [x] Tapping the clear `X` button immediately empties the search input and restores the full tier list.
- [x] Searching for a non-existent hero displays the empty state with a 1-tap reset button.
- [x] Toggling "Ban Priority" reorders heroes in descending order of Ban Rate.
- [x] Deactivating "Ban Priority" restores the standard tier group ordering.
- [x] Active lane filtering remains applied when Ban Priority is toggled or when searching.
- [x] Component tests verify debounced input handling, clear action, empty state, and ban sort order.

---

## Answer

Ticket 04 is fully implemented, reviewed, and verified:

1. **Pure Filter & Sort Utilities (`src/utils/draftFilter.ts`)**:
   - `filterHeroesBySearch`: Pure case-insensitive substring search on `hero.name`, trimming whitespace, non-mutating.
   - `sortHeroesByBanRate`: Pure sort ordering visible heroes strictly by `banRate` descending with `powerScore` tiebreaker, non-mutating.

2. **Draft Controls Bar (`src/components/DraftControls.tsx`)**:
   - Mobile draft control bar containing search input and "🛡️ Ban Priority" toggle pill.
   - 150ms debounce timer on typing to prevent UI stutter.
   - Cancels pending debounce timers immediately upon external prop updates or 1-tap clear.
   - 1-tap clear icon button (`X`) displayed when search input has text, resetting input and grid immediately.
   - Ban Priority toggle pill with `aria-pressed`, active neon rose styling, and pulsing active indicator dot.
   - All interactive touch targets strictly meet or exceed $\ge 44 \times 44\text{px}$.

3. **Shared Empty State Component (`src/components/EmptyState.tsx`)**:
   - Reusable empty state component consolidating search and lane empty states.
   - Displays clear iconography, contextual messages, and 1-tap recovery buttons (`Reset Search` / `Reset to All Lanes`).

4. **Dashboard Integration (`src/components/TierListDashboard.tsx`)**:
   - Composes active Lane filters, debounced text search, and Ban Priority sorting seamlessly.
   - In Ban Priority mode, surfaces must-ban threats strictly by descending ban rate at the top of the viewport.
   - Toggling off Ban Priority restores standard tier grouping (`S+` to `D`) ordered by Power Score.

5. **Test Coverage & Verification**:
   - Seam 0: 8 unit tests in `tests/components/draftFilter.test.ts`.
   - Seam 1: 8 unit tests in `tests/components/DraftControls.test.tsx` (including debounce timing, clear button, touch targets, and external reset cancellation).
   - Seam 2: 1 unit test in `tests/components/EmptyState.test.tsx`.
   - Seam 3: 14 integration tests in `tests/components/TierListDashboard.test.tsx` (covering search debounce, clear recovery, empty states, ban sort, and filter composition).
   - Full suite passes: 64 total tests (12 pipeline + 52 UI). Typecheck and production build pass cleanly.

