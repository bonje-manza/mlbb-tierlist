# 06: Rank & Time Toggles and Automated Build Pipeline

Type: task  
Status: resolved  
Blocked by: 01, 03, 04, 05  

**What to build:**  
Implement the Rank Tier and Time Window toggles in the UI, integrate multi-dataset loading, configure the GitHub Actions automated daily refresh workflow, and verify the end-to-end production build.

### Context & References
- Spec: [`.scratch/hero-tierlist/spec.md`](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/.scratch/hero-tierlist/spec.md) (Stories 11, 12, 13, 14, 21)
- Architecture: [ADR 0001: Direct GMS Ingestion & SSG Cache Pipeline](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/docs/adr/0001-direct-gms-ingestion-and-ssg-cache-pipeline.md)
- Domain Glossary: [`CONTEXT.md`](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/CONTEXT.md)

---

### Core Requirements

1. **Rank & Time Window Filter Controls**:
   - Secondary filter bar with segment toggles:
     - **Rank Tier**: `Mythic` (Default) vs `All Ranks`.
     - **Time Window**: `1 Day` (Default) vs `7 Days`.
   - Clear visual distinction between selected and unselected states.
   - Preserves active Lane filter and Search query when toggling datasets.

2. **Multi-Dataset Management**:
   - Ingestion pipeline generates all 4 permutation datasets:
     - `tierlist-mythic-1d.json`
     - `tierlist-mythic-7d.json`
     - `tierlist-all-1d.json`
     - `tierlist-all-7d.json`
   - UI seamlessly switches dataset in memory or fetches corresponding static file with instant feedback and zero layout jumps.

3. **Automated Refresh Workflow (`.github/workflows/update-tierlist.yml`)**:
   - Cron schedule: `0 1 * * *` (Daily at 01:00 UTC, 1 hour after Moonton recalculation).
   - Manual trigger: `workflow_dispatch`.
   - Workflow steps:
     1. Checkout repository.
     2. Setup Node.js.
     3. Install dependencies.
     4. Execute telemetry sync (`npm run sync`).
     5. Build static production bundle (`npm run build`).
     6. Commit updated data artifacts or deploy to target host.

4. **Production Build & Verification**:
   - Full build pipeline passes (`npm run build`) producing optimized, static client bundle under 50KB gzip initial JS.
   - Integration tests verify rank and window dataset toggling.

---

### Acceptance Criteria

- [x] UI provides intuitive toggles for Rank Tier (`Mythic` vs `All Ranks`) and Time Window (`1 Day` vs `7 Days`).
- [x] Toggling rank or time window smoothly updates the displayed tier list and hero stats.
- [x] Active lane tab and search filters persist when switching rank or time window.
- [x] Ingestion script exports all 4 permutations (`mythic-1d`, `mythic-7d`, `all-1d`, `all-7d`).
- [x] GitHub Actions workflow configuration is valid and triggers on schedule and manual dispatch.
- [x] Production build succeeds with zero errors or warnings.
- [x] Integration test verifies end-to-end switching between rank and time window datasets.

## Answer

Implemented Rank Tier and Time Window segment controls, seamless multi-dataset caching, automated daily refresh workflow, and bundle size budget checks:

1. **Rank & Time Window Segment Controls (`DatasetControls.tsx`)**:
   - Built secondary filter bar adhering to Esports Dark Cyber aesthetic.
   - Segment toggles for Rank Tier (`Mythic` default vs `All Ranks`) and Time Window (`1 Day` default vs `7 Days`).
   - High-contrast active styling (`cyan` for Rank Tier, `purple` for Time Window) with `aria-checked` and accessible `radiogroup`/`radio` markup.
   - Touch targets strictly $\ge 44 \times 44\text{px}$ (`min-h-[44px] min-w-[44px]`).

2. **Multi-Dataset Management & Zero Layout Jumps (`TierListDashboard.tsx`)**:
   - In-memory dataset caching keyed by `DatasetKey` (`${rank}-${window}`).
   - Instant switching when cached with zero layout jumps; uncached fetches keep existing grid visible and render a top pulse progress bar (`dataset-loading-bar`).
   - Request race condition prevention via active request tracking and cleanup logic.
   - Preserves active Lane filter, debounced search query, and Ban Priority toggle across dataset switches.
   - Synchronizes open bottom sheet drawer to display updated stats for the inspected hero.
   - Robust URL resolution for root-level and path-based endpoints.

3. **Automated Refresh Workflow (`.github/workflows/update-tierlist.yml`)**:
   - Automated scheduled daily cron workflow at `0 1 * * *` (1 hour after Moonton's 00:00 UTC daily calculation) plus `workflow_dispatch`.
   - Checkout, Node.js 22 setup with npm caching, dependency installation, `npm run sync`, `npm run build`, and `npm run check:bundle`.
   - Automated git commit & push for updated telemetry datasets and airgap backups (standard commit message without `[skip ci]` to ensure Cloudflare Pages builds trigger).

4. **Production Build & Performance Budget**:
   - Optimized Rollup chunking configuration in `vite.config.ts` separating vendor libraries.
   - Initial client JS bundle (`index-*.js`) is **8.39 KB gzip**, well under the 50 KB gzip performance budget.
   - Enforced via dedicated script `scripts/check-bundle-size.mjs` and npm script `npm run check:bundle`.

5. **Testing & Code Review**:
   - 9 unit tests in `tests/components/DatasetControls.test.tsx`.
   - 9 integration tests in `tests/components/TierListDashboard.test.tsx` for Seam 5 verifying dataset switching, filter persistence, drawer re-binding, zero layout jumps, and race condition prevention.
   - All 90 UI tests and 12 pipeline tests pass cleanly. All code review findings across Standards and Spec addressed.
