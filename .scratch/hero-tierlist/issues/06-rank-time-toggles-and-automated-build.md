# 06: Rank & Time Toggles and Automated Build Pipeline

Type: task  
Status: ready-for-agent  
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

- [ ] UI provides intuitive toggles for Rank Tier (`Mythic` vs `All Ranks`) and Time Window (`1 Day` vs `7 Days`).
- [ ] Toggling rank or time window smoothly updates the displayed tier list and hero stats.
- [ ] Active lane tab and search filters persist when switching rank or time window.
- [ ] Ingestion script exports all 4 permutations (`mythic-1d`, `mythic-7d`, `all-1d`, `all-7d`).
- [ ] GitHub Actions workflow configuration is valid and triggers on schedule and manual dispatch.
- [ ] Production build succeeds with zero errors or warnings.
- [ ] Integration test verifies end-to-end switching between rank and time window datasets.
