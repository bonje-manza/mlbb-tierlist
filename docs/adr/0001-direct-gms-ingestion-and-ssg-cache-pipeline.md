# ADR 0001: Direct GMS Ingestion & SSG Cache Pipeline

## Status
Accepted

## Context
The MLBB Tier-List MVP requires reliable, daily-updated hero win rate, pick rate, and ban rate telemetry across competitive rank tiers (primarily Mythic) for mobile web ranked players during drafting.

Moonton provides no official public developer API. However, official rank statistics at `mobilelegends.com/rank` are backed by an internal REST service (`api.gms.moontontech.com`) authenticated via dynamic HMAC-SHA1 request signing with a runtime `enigma` secret. In addition, an open-source community REST wrapper (`arena.rone.dev`, BSD license) mirrors this endpoint.

We needed an architecture that guarantees high availability, zero server maintenance costs, resilient failover, and fast mobile delivery without subjecting client browsers to WAF anti-bot blocks or API changes.

## Decision
1. **Direct Ingestion as Primary**: We ingest telemetry directly from `https://api.gms.moontontech.com/api/gms/source/2669606/{sourceId}` using a native Node.js HMAC-SHA1 signer. We do not require third-party proxies during standard operation.
2. **Three-Tier Failover Policy**:
   * **Primary Tier**: Direct Moonton GMS API (`api.gms.moontontech.com`).
   * **Secondary Tier**: Automatic failover to Rone Arena API (`arena.rone.dev/api/heroes/rank`) if GMS returns non-200 HTTP, error envelopes (`code !== 0`), or connection timeouts.
   * **Tertiary Tier (Airgap Snapshot)**: Serve the last successfully cached static JSON snapshot with a visible "Data as of [timestamp]" indicator if all upstream endpoints fail.
3. **Daily Scheduled Build via SSG (Static Site Generation)**:
   * Moonton batches and recalculates global ranked telemetry once every 24 hours at ~00:00 UTC (08:00 GMT+8).
   * A GitHub Actions cron workflow executes daily at **01:00 UTC** (allowing a 60-minute buffer for upstream batch completion) and supports manual `workflow_dispatch`.
   * The pipeline fetches `pageSize: 200` records for `Mythic` (bigrank `7`) and `All Ranks` (bigrank `101`) across Past 1 Day and Past 7 Days windows, normalizes the data into static JSON files (`meta-tierlist.json`), and deploys the static mobile web application.
4. **Client Isolation**: The client-side mobile web frontend strictly fetches static JSON from our own CDN/origin and **never** makes direct network requests to Moonton GMS or third-party APIs.

## Consequences
### Positive
* **Zero Infrastructure Cost**: No long-running servers, VPS, or cloud databases required. Deploys cleanly to static hosts (GitHub Pages, Cloudflare Pages, Vercel).
* **High Availability & Fault Tolerance**: Build failures do not break production; the existing static snapshot remains live.
* **WAF Protection**: Running 1-2 build runs per day consumes fewer than 10 total requests/day, remaining well below Alibaba Cloud WAF thresholds.
* **Fast Mobile UX**: Pre-computed static JSON loads in milliseconds on mobile networks.

### Negative
* **Intra-day Stash Latency**: Real-time intraday balance patches or hotfixes will not reflect until the next 01:00 UTC cron run or manual dispatch trigger. (Acceptable since Moonton itself only aggregates telemetry once daily).
