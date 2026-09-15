# Effort Map: Direct Moonton GMS Fetch

## Notes
Investigating direct ingestion from Moonton's Game Management System (GMS) endpoint (`api.gms.moontontech.com`) to eliminate reliance on external third-party proxies (`arena.rone.dev`).

## Decisions so far
- **01-direct-moonton-gms-fetch**: Direct Moonton GMS fetch validated with HTTP 200, ~170ms latency, zero dependencies, and top 10 hero table produced. Permissive signature validation discovered; Moonton encapsulates application errors inside HTTP 200 (`code: 400`). Captured on branch `prototype/direct-rank-fetch` in `prototype/prototype_direct_fetch.mjs`. See [01-direct-moonton-gms-fetch.md](file:///c:/Users/Admin/Documents/code/mlbb-tierlist/.scratch/direct-fetch/issues/01-direct-moonton-gms-fetch.md).

## Fog
- [ ] Determine whether to schedule a local SQLite sync cron job or on-demand cache for the production tier-list backend.
- [ ] Implement TDD test suite for HMAC-SHA1 stringToSign generator.
