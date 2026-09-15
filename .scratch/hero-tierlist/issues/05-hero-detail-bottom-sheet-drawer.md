# 05: Hero Detail Bottom Sheet Drawer

Type: task  
Status: resolved  
Blocked by: 02  

**What to build:**  
Implement the animated mobile bottom sheet drawer that opens upon tapping any hero tile, presenting in-depth Win/Pick/Ban telemetry and the Top 3 synergistic teammate heroes.

### Context & References
- Spec: [`.scratch/hero-tierlist/spec.md`](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/.scratch/hero-tierlist/spec.md) (Stories 18, 19, 20, 21, 24)
- Architecture: [ADR 0003: Mobile Web Draft UX & Filter Taxonomy](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/docs/adr/0003-mobile-web-draft-ux-and-filter-taxonomy.md)
- Domain Glossary: [`CONTEXT.md`](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/CONTEXT.md)

---

### Core Requirements

1. **Animated Mobile Drawer / Bottom Sheet**:
   - Slides up smoothly from bottom of screen upon hero tile tap.
   - Dark translucent backdrop scrim (`bg-black/60 backdrop-blur-sm`).
   - Dismissible via tap outside (backdrop click), swipe/drag handle down, or close button (`X`).
   - Locks background body scroll while active.

2. **Hero Profile Header**:
   - Large hero avatar portrait with border color matched to hero's tier neon accent.
   - Hero name, assigned roles (e.g., "Support / Mage"), and assigned lanes (e.g., "Roam, Mid Lane").
   - Large tier pill badge (e.g., "S+ TIER") and Composite Power Score (e.g., "Power Score: 88.4").

3. **Telemetry Benchmark Cards**:
   - Visual benchmark progress bars for the 3 core metrics:
     - **Win Rate**: e.g., `57.95%` with fill bar relative to hero pool.
     - **Pick Rate**: e.g., `0.89%` with fill bar relative to hero pool.
     - **Ban Rate**: e.g., `10.91%` with fill bar relative to hero pool.

4. **Top 3 Synergistic Teammates**:
   - Section header: "Top Duo Synergies" / "Best Teammates".
   - Displays up to 3 synergistic partner heroes extracted from `hero.synergies`.
   - Each partner card displays:
     - Partner hero avatar.
     - Partner hero name.
     - Positive win-rate synergy delta badge (e.g., `+6.37% WR`).
   - Fallback empty state message if no positive synergy partners exist for this hero.

5. **Accessibility & Touch Targets**:
   - Touch targets for close button and interactive cards meet $\ge 44 \times 44\text{px}$.
   - Proper modal ARIA semantics (`role="dialog"`, `aria-modal="true"`, Escape key support).

---

### Acceptance Criteria

- [x] Tapping any hero tile opens the Bottom Sheet drawer with smooth slide-up animation.
- [x] Drawer displays exact Win Rate, Pick Rate, Ban Rate, Power Score, and Tier badge.
- [x] Metric progress bars accurately visualize values.
- [x] Displays the Top 3 synergistic partner heroes with avatar, name, and positive win-rate delta.
- [x] Tapping outside the sheet, clicking the close button, or pressing Escape dismisses the drawer immediately.
- [x] Background scrolling is locked while the drawer is open.
- [x] Component tests verify drawer opening, telemetry content, synergy rendering, and dismiss behaviors.

## Answer

Implemented the native mobile bottom sheet drawer in `src/components/HeroDetailDrawer.tsx` and integrated it into `src/components/TierListDashboard.tsx`:

1. **Slide-Up Bottom Sheet & Dismissal**:
   - Added `.animate-slide-up` and `.animate-fade-in` CSS keyframe animations in `src/index.css`.
   - Backdrop scrim with `bg-black/60 backdrop-blur-sm` dismisses the sheet on tap.
   - Interactive pull-down handle detects downward touch gestures ($> 60\text{px}$) to dismiss.
   - Accessible top-right close button (`X`) with touch target $\ge 44 \times 44\text{px}$.
   - Keyboard listener dismisses on `Escape`.
   - Background body scroll locking dynamically sets `document.body.style.overflow = 'hidden'` on mount and restores previous style on unmount.

2. **Hero Profile Header**:
   - Large hero avatar portrait ($80\times 80\text{px}$) with neon tier accent border (`border-tier-s-plus`, `border-tier-s`, etc.) and glowing ring matching hero tier.
   - Local SVG fallback placeholder on broken image error.
   - Hero name, assigned roles (`roles.join(' / ')`), assigned lanes (`lanes.join(', ')`), tier badge (`{tier} TIER`), and Composite Power Score pill (`Power Score: {hero.powerScore.toFixed(1)}`).

3. **Telemetry Benchmark Cards**:
   - Visual benchmark progress cards for Win Rate, Pick Rate, and Ban Rate displaying exact two-decimal percentages (e.g. `57.95%`, `0.89%`, `10.91%`).
   - Fill progress bars relative to the active hero pool min-max boundaries (`role="progressbar"`, `aria-valuenow`).

4. **Top 3 Synergistic Teammates**:
   - "Top Duo Synergies" section displaying up to 3 synergistic teammate heroes from `hero.synergies`.
   - Each partner card displays partner avatar (with fallback), partner name, and positive win-rate delta badge (`+{delta}% WR`).
   - Interactive partner cards meet $\ge 44\times 44\text{px}$ touch targets; clicking any partner card seamlessly navigates to that hero's detail in the drawer.
   - Graceful empty state fallback when no positive synergy partners exist.

5. **Test Coverage**:
   - 15 unit tests in `tests/components/HeroDetailDrawer.test.tsx` verifying profile header, benchmark progress bars, synergy partner rendering, dismiss interactions, body scroll lock, and accessibility.
   - 5 integration tests in `tests/components/TierListDashboard.test.tsx` verifying tile click-to-open from standard tier bands and Ban Priority grid, partner navigation, and dismiss.
   - All 72 tests across 9 suites pass cleanly.
