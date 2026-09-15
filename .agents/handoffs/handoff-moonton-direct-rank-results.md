# Handoff: Moonton Direct GMS Rank Telemetry Validation Results

## 1. Executive Summary & Viability Verdict
* **Direct `api.gms.moontontech.com` Viability**: **YES (Fully Validated)**.
* Direct ingestion from Moonton's official GMS telemetry endpoint has been proven without requiring third-party proxies (`arena.rone.dev`).
* Zero third-party runtime dependencies needed: executes entirely via native Node.js (`fetch` and `node:crypto`).
* **Branch Reference**: `prototype/direct-rank-fetch` (commit `fc1c33a`).
* **Executable Prototype**: `prototype/prototype_direct_fetch.mjs` (run via `npm run prototype` or `node prototype/prototype_direct_fetch.mjs`).

---

## 2. Latency & Repeatability Profile

Live benchmarks across repeated sequential runs against Moonton GMS (`api.gms.moontontech.com`):

| Metric | Measured Value | Notes |
| :--- | :--- | :--- |
| **HTTP Success Rate** | 100% (3/3 runs HTTP 200) | No dropped connections or transient 5xx errors |
| **Handshake Latency (`/api/act/basev4`)** | 185.2 ms avg (76.6 ms – 258.4 ms) | Fetches dynamic `enigma` HMAC key |
| **Telemetry Query Latency (`/api/gms/source/...`)** | 170.8 ms avg (103.2 ms – 277.5 ms) | Fetches ranked hero records |
| **Total End-to-End Latency** | 358.6 ms avg cold, ~180 ms warm | Fast enough for background sync cron jobs |

---

## 3. Query Schema & Extracted Payload Shape

### 3.1 Request Specification
* **Handshake Endpoint**: `GET https://api.gms.moontontech.com/api/act/basev4`
  * Headers: `X-AppId: 2669606`, `X-ActId: 2669607`, `X-Lang: en`
  * Extract: `data.server.enigma`
* **Telemetry Endpoint**: `POST https://api.gms.moontontech.com/api/gms/source/2669606/2756567`
  * Source IDs: `2756567` (Past 1 Day), `2756569` (Past 7 Days)
  * Headers: `Content-Type: application/json`, `X-AppId: 2669606`, `X-ActId: 2669607`, `X-Lang: en`, `Authorization: <hmac_hex>`
  * Body Payload:
    ```json
    {
      "pageSize": 200,
      "filters": [
        { "field": "bigrank", "operator": "eq", "value": "7" },
        { "field": "match_type", "operator": "eq", "value": 0 }
      ],
      "sorts": [
        { "data": { "field": "main_hero_win_rate", "order": "desc" }, "type": "sequence" }
      ],
      "fields": [
        "main_hero",
        "main_hero_appearance_rate",
        "main_hero_ban_rate",
        "main_hero_win_rate",
        "main_heroid",
        "_updatedAt"
      ]
    }
    ```
    *(Note: `bigrank: "7"` for Mythic, `"101"` for All Ranks).*

### 3.2 Extracted Normalized Fields

| Output Field | Path in Raw JSON | Format / Transformation | Live Sample |
| :--- | :--- | :--- | :--- |
| **Hero Name** | `record.data.main_hero.data.name` | String | `"Rafaela"` |
| **Hero ID** | `record.data.main_heroid` | Integer | `14` |
| **Winrate** | `record.data.main_hero_win_rate` | Unrounded float ratio -> `(val * 100).toFixed(2) + '%'` | `0.579503` -> `57.95%` |
| **Pickrate** | `record.data.main_hero_appearance_rate` | Unrounded float ratio -> `(val * 100).toFixed(2) + '%'` | `0.008946` -> `0.89%` |
| **Banrate** | `record.data.main_hero_ban_rate` | Unrounded float ratio -> `(val * 100).toFixed(2) + '%'` | `0.109148` -> `10.91%` |
| **Patch / Version** | `record.data.main_hero.data.head` | Regex `/homepage_(\d+)_(\d+)_(\d+)/` or fallback | `2.1.88` (fallback `2.1.41`) |
| **Timestamp** | `record._updatedAt` | Millisecond timestamp -> ISO-8601 UTC | `"2026-09-14T14:55:00.629Z"` |

---

## 4. Cryptographic HMAC-SHA1 & Failure Modes

### 4.1 Signing Algorithm
* Construct `stringToSign`: `['POST', path, '', JSON.stringify(payload)].join('\n')` (4 newline-separated tokens: Method, Path, empty query string, JSON body).
* Signature: `crypto.createHmac('sha1', enigma).update(stringToSign).digest('hex')`.
* Pass in header: `Authorization: <signature>`.

### 4.2 Probed Failure Modes & Defensive Rules
1. **Permissive Backend Auth**: Moonton GMS currently accepts requests even with an invalid or omitted HMAC header. However, clients should continue sending valid HMAC-SHA1 to prevent breakage if enforcement is turned on.
2. **Application Error Envelope Inside HTTP 200**: When sending malformed JSON or invalid query syntax, Moonton returns HTTP 200 with `{ code: 400, message: "invalid character...", data: null }`. Ingestion code must verify both `res.ok` AND `json.code === 0`.
3. **Invalid Route / Source ID**: Calling non-existent source IDs returns HTTP 400 with a null body; invalid handshake paths return HTTP 404 text.
4. **Timeout Handling**: Handshake and query calls should wrap fetch with `AbortSignal.timeout(5000)`.

---

## 5. Rate Limits & Operational Recommendations
* **Upstream Freshness**: Moonton GMS aggregates rank data **once every 24 hours** (around 00:00 UTC / 08:00 GMT+8). Polling frequently provides zero additional freshness.
* **WAF Considerations**: The domain is protected by Alibaba Cloud WAF (`acw_tc` cookies). A lightweight server-side cron job running 1-2 times daily (e.g. at 00:30 UTC and 12:30 UTC) requires fewer than 10 requests/day total, completely avoiding any WAF / rate-limiting triggers.

---

## 6. Context Pointers in Repository
* Prototype Script: `prototype/prototype_direct_fetch.mjs`
* Resolved Ticket: `.scratch/direct-fetch/issues/01-direct-moonton-gms-fetch.md`
* Effort Map: `.scratch/direct-fetch/map.md`
* Research Spike: `.scratch/research/mlbb-data-source.md`
* Git Branch: `prototype/direct-rank-fetch`

---

## 7. Suggested Skills for Next Session
* **`tdd`** (`.agents/skills/tdd/SKILL.md`): Use to build the production ingestion client (HMAC signature builder, schema parser, error handling) test-first.
* **`code-review`** (`.agents/skills/code-review/SKILL.md`): Use to review the prototype implementation and verify standards adherence before merging into main.
