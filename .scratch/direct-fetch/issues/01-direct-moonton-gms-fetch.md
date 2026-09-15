# 01-direct-moonton-gms-fetch

Type: prototype  
Status: resolved  
Branch: prototype/direct-rank-fetch  

## Question

Can we reliably retrieve live MLBB rank telemetry directly from Moonton's internal GMS endpoint (`api.gms.moontontech.com`) using native Node.js and dynamic HMAC-SHA1 signing, without relying on the third-party proxy (`arena.rone.dev`)? What are the latency characteristics and failure modes?

## Answer

**Verdict**: **YES, fully validated.** Direct Moonton GMS rank fetching works consistently, returns HTTP 200 repeatedly with low latency (~170ms for telemetry, ~350ms total E2E), and can be executed using 100% native Node.js (`fetch` + `crypto`) with zero runtime dependencies.

### 1. Repeatability & Latency Benchmarks (3 Consecutive Runs)

| Run | Status | Handshake Latency (`/api/act/basev4`) | Telemetry Query Latency (`/api/gms/source/...`) | Total E2E Latency | Enigma Key Prefix | Records Returned |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | HTTP 200 | 258.4ms | 277.5ms | 536.8ms | `d70391ab...` | 10 |
| 2 | HTTP 200 | 220.5ms | 131.8ms | 352.5ms | `d70391ab...` | 10 |
| 3 | HTTP 200 | 76.6ms | 103.2ms | 181.4ms | `d70391ab...` | 10 |

* **Averages**: Handshake = **185.2ms** | Telemetry = **170.8ms** | Total E2E = **358.6ms** (drops to ~180ms on warm connection).

### 2. Live Top 10 Heroes by Win Rate (Rank: Mythic, Window: Past 1 Day)

Snapshot captured directly from Moonton GMS:

| Rank | Hero | Winrate | Pickrate | Banrate | Patch / Version | Updated At (UTC) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Rafaela | 57.95% | 0.89% | 10.91% | 2.1.88 | 2026-09-14T14:55:00.629Z |
| 2 | Marcel | 57.47% | 0.15% | 8.69% | 2.1.88 | 2026-09-14T14:55:00.629Z |
| 3 | Gloo | 56.67% | 0.48% | 48.79% | 2.1.88 | 2026-09-14T14:55:00.629Z |
| 4 | Argus | 56.03% | 0.47% | 1.40% | 2.1.88 | 2026-09-14T14:55:00.629Z |
| 5 | Lolita | 55.92% | 0.09% | 0.37% | 2.1.88 | 2026-09-14T14:55:00.629Z |
| 6 | Minotaur | 55.69% | 0.54% | 5.78% | 2.1.88 | 2026-09-14T14:55:00.629Z |
| 7 | Sun | 55.64% | 1.77% | 42.74% | 2.1.88 | 2026-09-14T14:55:00.629Z |
| 8 | Estes | 55.22% | 0.67% | 61.48% | 2.1.88 | 2026-09-14T14:55:00.629Z |
| 9 | Popol and Kupa | 54.39% | 0.37% | 0.40% | 2.1.88 | 2026-09-14T14:55:00.629Z |
| 10 | Hanabi | 54.39% | 4.11% | 18.54% | 2.1.88 | 2026-09-14T14:55:00.629Z |

### 3. Failure Modes Catalog & Architectural Findings

| Scenario | HTTP Status | Moonton Code / Payload | Finding & Architectural Implication |
| :--- | :--- | :--- | :--- |
| **Invalid HMAC Signature** | 200 | `code: 0`, `records` returned | **Permissive backend**: Moonton's GMS backend currently does not reject telemetry queries with invalid or missing Authorization headers. We will still emit canonical HMAC-SHA1 to remain strictly compliant with web client behavior. |
| **Invalid Source ID / Path** | 400 | `null` body | **Handled**: Returning non-existent source IDs triggers an HTTP 400 with a null body. Handled by verifying `res.ok`. |
| **Invalid Base Handshake Path** | 404 | `404 page not found` | **Handled**: Route misconfigurations fail cleanly with HTTP 404 text. |
| **Malformed JSON Payload** | 200 | `code: 400`, `message: "invalid character..."` | **Critical Error Envelope**: Moonton responds with HTTP 200 even on JSON parsing errors, encapsulating error code 400 inside the JSON payload. Code MUST inspect `json.code === 0`. |
| **Request Timeout** | ABORTED | `TimeoutError` | **Handled**: Timeouts can be cleanly enforced using Node's `AbortSignal.timeout(ms)`. |

### 4. Primary Source Artifacts

- Executable script: `prototype/prototype_direct_fetch.mjs`
- Test command: `node prototype/prototype_direct_fetch.mjs`
