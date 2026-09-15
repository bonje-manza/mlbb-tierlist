# 04: Debounced Search and Ban Priority Sort

Type: task  
Status: ready-for-agent  
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

- [ ] Typing in the search input updates the visible hero grid with 150ms debounce.
- [ ] Tapping the clear `X` button immediately empties the search input and restores the full tier list.
- [ ] Searching for a non-existent hero displays the empty state with a 1-tap reset button.
- [ ] Toggling "Ban Priority" reorders heroes in descending order of Ban Rate.
- [ ] Deactivating "Ban Priority" restores the standard tier group ordering.
- [ ] Active lane filtering remains applied when Ban Priority is toggled or when searching.
- [ ] Component tests verify debounced input handling, clear action, empty state, and ban sort order.
