# MLBB Hero Winrate & Pickrate Data Source Research

> **Document Type:** Research Spike / Data Source Evaluation  
> **Target Consumer:** Tier-List MVP Architecture, `/grill-with-docs`, `/prototype`  
> **Investigation Date:** September 2026  
> **Investigation Target:** Primary sources backing [https://www.mobilelegends.com/rank](https://www.mobilelegends.com/rank), Moonton internal GMS infrastructure, and community wrappers.

---

## 1. Executive Summary

Mobile Legends: Bang Bang (MLBB) does not provide a developer portal or officially documented public REST API for hero telemetry. However, the official hero statistics leaderboard at `https://www.mobilelegends.com/rank` is powered by an internal RESTful microservice on Moonton's Game Management System (GMS): **`https://api.gms.moontontech.com`**.

Through runtime deobfuscation of the official web client bundle (`index-*.js`, `utils-*.js`), we extracted the complete handshake, query schema, parameter taxonomy, and cryptographic HMAC-SHA1 signing algorithm used by Moonton. In addition, an active, battle-tested open-source community REST wrapper (`arena.rone.dev`, BSD license) mirrors this exact data without requiring custom signature generation.

### Quick Evaluation Matrix

| Source / Approach | Access Method | Auth / Signature | Freshness | Rank Breakdown | Counters / Synergies | Maintenance Overhead |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Direct Moonton GMS API** (Primary) | HTTP POST | Dynamic HMAC-SHA1 via `enigma` | Daily (rolling 1/3/7/15/30d) | All, Epic, Legend, Mythic, Honor, Glory+ | Full `sub_hero` synergy deltas | Low (self-contained signing module) |
| **Rone Arena API** (`arena.rone.dev`) (Fallback 1) | HTTP GET | None (Public REST) | Daily (mirrors GMS) | All, Epic, Legend, Mythic, Honor, Glory+ | Full `sub_hero` synergy deltas | Zero (managed third-party) |
| **Pren7 Scraper Dump** (`Pren7/MLBB-Winrate`) (Fallback 2) | HTTP GET (Raw GitHub) | None (Raw JSON) | Daily (17:00 UTC GitHub Actions) | "All Ranks" only | None | Zero (flat file), but coarse data |

---

## 2. Official Backing Endpoints (`mobilelegends.com/rank`)

The rank page is a React/Vite Single Page Application. It uses a 2-step handshake:
1. **Config & Enigma Handshake (`/api/act/basev4`)**: Retrieves CDN configurations, client locale, and a dynamic cryptographic signing key (`server.enigma`).
2. **Data Query (`/api/gms/source/{appId}/{sourceId}`)**: Dispatches a signed POST query requesting hero win rates, appearance rates, ban rates, and synergy matrices.

```
+---------------------+               +--------------------------------------+
| MLBB Tier-List App  |               | api.gms.moontontech.com              |
+----------+----------+               +------------------+-------------------+
           |                                             |
           | 1. GET /api/act/basev4                      |
           +-------------------------------------------->|
           |                                             |
           | 2. Returns server.enigma + CDN paths        |
           |<--------------------------------------------+
           |                                             |
           | 3. Compute HMAC-SHA1(stringToSign, enigma)  |
           |                                             |
           | 4. POST /api/gms/source/2669606/{sourceId}  |
           |    [Headers: X-AppId, X-ActId, Auth, etc.]  |
           +-------------------------------------------->|
           |                                             |
           | 5. Returns 133 heroes + win/pick/ban rates  |
           |<--------------------------------------------+
```

### 2.1 Handshake Endpoint: `/api/act/basev4`

* **URL**: `https://api.gms.moontontech.com/api/act/basev4`
* **Method**: `GET`
* **Purpose**: Fetches system configuration and the runtime signing key (`enigma`).
* **Required Headers**:
  * `X-AppId: 2669606`
  * `X-ActId: 2669607`
  * `X-Lang: en` (or any valid locale: `id`, `ph`, `ru`, etc.)
* **Query Parameters**: None required (optional: `debug=true`).
* **Sample Request**:
  ```bash
  curl -s "https://api.gms.moontontech.com/api/act/basev4" \
    -H "X-AppId: 2669606" \
    -H "X-ActId: 2669607" \
    -H "X-Lang: en"
  ```
* **Sample Response (truncated)**:
  ```json
  {
    "code": 0,
    "message": "OK",
    "data": {
      "client": {
        "cdnPrefix": "https://akmweb.youngjoygame.com/web/gms/act_2669607_7296bbbffb7bf64de9273d9bb800f5fd",
        "cdnPrefixLang": "https://akmweb.youngjoygame.com/web/gms/act_2669607_1d62ffd0ee32987b49f0192bafde04bd",
        "countryCode": "ph",
        "game": { "type": "MLBB" },
        "lang": "en"
      },
      "server": {
        "enigma": "d70391ab690e8e59d925a93a4c1d1798",
        "time": 1789406635741
      }
    }
  }
  ```

---

### 2.2 Hero Rank Telemetry Endpoint: `/api/gms/source/{appId}/{sourceId}`

* **Base URL**: `https://api.gms.moontontech.com`
* **Path**: `/api/gms/source/2669606/{sourceId}`
* **Method**: `POST`
* **App ID**: `2669606` (fixed identifier for the rank application)
* **Source IDs (`{sourceId}`) by Time Window**:
  Moonton partitions historical match aggregations into 5 distinct data source IDs:

  | Time Window | Source ID | Internal CDN Backup Ref |
  | :--- | :--- | :--- |
  | **Past 1 Day** | `2756567` | `hero_predict_1.json` |
  | **Past 3 Days** | `2756568` | `hero_predict_3.json` |
  | **Past 7 Days** | `2756569` | `hero_predict_7.json` |
  | **Past 15 Days** | `2756565` | `hero_predict_15.json` |
  | **Past 30 Days** | `2756570` | `hero_predict_30.json` |

* **Headers**:
  * `Content-Type: application/json`
  * `X-AppId: 2669606`
  * `X-ActId: 2669607`
  * `X-Lang: en`
  * `Authorization: <Hex-encoded HMAC-SHA1 signature>`

#### Request Body Schema & Parameters

The POST request payload is a structured query object:

```json
{
  "pageSize": 200,
  "filters": [
    { "field": "bigrank", "operator": "eq", "value": "101" },
    { "field": "match_type", "operator": "eq", "value": 0 },
    { "field": "main_heroid", "operator": "eq", "value": 1 }
  ],
  "sorts": [
    {
      "data": { "field": "main_hero_win_rate", "order": "desc" },
      "type": "sequence"
    }
  ],
  "fields": [
    "main_hero",
    "main_hero_appearance_rate",
    "main_hero_ban_rate",
    "main_hero_channel",
    "main_hero_win_rate",
    "main_heroid",
    "data.sub_hero.hero",
    "data.sub_hero.hero_channel",
    "data.sub_hero.increase_win_rate",
    "data.sub_hero.heroid",
    "_updatedAt"
  ]
}
```

#### Parameter Reference Table

| Field | Type | Description | Accepted Values |
| :--- | :--- | :--- | :--- |
| `pageSize` | `number` | Number of heroes to return | `1` to `200` (`200` returns all 133 heroes in a single call) |
| `filters[].bigrank` | `string` | Competitive Rank Tier filter | `"101"` = All Ranks<br>`"5"` = Epic<br>`"6"` = Legend<br>`"7"` = Mythic<br>`"8"` = Mythical Honor<br>`"9"` = Mythical Glory+ |
| `filters[].match_type`| `number` | Game Match Type | `0` = Standard Ranked Matches |
| `filters[].main_heroid`| `number` | Hero ID filter (optional) | Integer (e.g. `1` for Miya, `14` for Rafaela; omit to query all heroes) |
| `sorts[].data.field` | `string` | Metric to order results by | `"main_hero_win_rate"`, `"main_hero_appearance_rate"`, `"main_hero_ban_rate"` |
| `sorts[].data.order` | `string` | Direction of sort | `"desc"`, `"asc"` |
| `fields` | `string[]` | Projection array of fields | `main_hero`, `main_hero_win_rate`, `main_hero_appearance_rate`, `main_hero_ban_rate`, `main_heroid`, `main_hero_channel`, `data.sub_hero.*`, `_updatedAt` |

#### Response Schema

Verified live response structure:

```json
{
  "code": 0,
  "message": "OK",
  "data": {
    "records": [
      {
        "_updatedAt": 1789397700629,
        "data": {
          "main_hero": {
            "data": {
              "name": "Rafaela",
              "head": "https://akmweb.youngjoygame.com/web/svnres/img/test/homepage_2_1_88_1205_1/100_68277dce415742c4a98883151c693a07.png"
            }
          },
          "main_heroid": 14,
          "main_hero_win_rate": 0.586095,
          "main_hero_appearance_rate": 0.012772,
          "main_hero_ban_rate": 0.166727,
          "main_hero_channel": { "id": 2678750 },
          "sub_hero": [
            {
              "heroid": 132,
              "hero": {
                "data": { "head": "https://akmweb.youngjoygame.com/.../100_df7603c292198b.png" }
              },
              "hero_channel": { "id": 3280483 },
              "increase_win_rate": 0.063699
            }
          ]
        }
      }
    ],
    "total": 133
  }
}
```

*Note on telemetry precision:* Win, appearance (pick), and ban rates are unrounded floating-point ratios (`0.586095` = 58.61% win rate). `sub_hero[].increase_win_rate` provides quantitative synergy value (+6.37% win rate boost when paired with Hero 132).

---

## 3. Cryptographic Signature & Authentication

Moonton uses request signing to prevent trivial scraping, though without user session tokens for rank telemetry.

### 3.1 Signing Algorithm

From `index-06f6d0af.js`:
```javascript
const f = new URL("".concat(e.baseURL).concat(e.url)),
      d = [
        e.method.toLocaleUpperCase(),
        f.pathname,
        Nv.stringify(e.params, { encode: false }),
        JSON.stringify(e.data || {})
      ].join("\n");
e.headers.Authorization = Hex(HmacSHA1(d, enigma));
```

The String to Sign is formatted as four newline-separated tokens:
```
<HTTP_METHOD>\n<PATH>\n<QUERY_STRING>\n<JSON_BODY>
```

For rank telemetry:
* `HTTP_METHOD`: `POST`
* `PATH`: `/api/gms/source/2669606/2756567`
* `QUERY_STRING`: `""` (empty line if no URL search parameters)
* `JSON_BODY`: Exact JSON serialization of the payload (e.g. `{"pageSize":200,"filters":[...],...}`)
* `KEY`: The string `server.enigma` obtained from `/api/act/basev4`
* `HASH`: HMAC-SHA1, formatted as lowercase Hexadecimal or Base64 (both are accepted by the server; web client emits Hex).

### 3.2 Verified Working NodeJS Script

Save and run this standalone script (`node fetch_rank.js`):

```javascript
const crypto = require('crypto');

async function fetchMLBBHeroStats(days = 1, rankTier = '101') {
  const sourceMap = { 1: '2756567', 3: '2756568', 7: '2756569', 15: '2756565', 30: '2756570' };
  const sourceId = sourceMap[days] || '2756567';
  const appId = '2669606';
  const actId = '2669607';

  // 1. Fetch enigma key
  const baseRes = await fetch('https://api.gms.moontontech.com/api/act/basev4', {
    headers: { 'X-AppId': appId, 'X-ActId': actId, 'X-Lang': 'en' }
  });
  const baseData = await baseRes.json();
  const enigma = baseData.data?.server?.enigma;
  if (!enigma) throw new Error('Failed to retrieve enigma key');

  // 2. Prepare payload
  const path = `/api/gms/source/${appId}/${sourceId}`;
  const payload = {
    pageSize: 200, // Retrieves all 133 heroes in one call
    filters: [
      { field: 'bigrank', operator: 'eq', value: rankTier },
      { field: 'match_type', operator: 'eq', value: 0 }
    ],
    sorts: [
      { data: { field: 'main_hero_win_rate', order: 'desc' }, type: 'sequence' }
    ],
    fields: [
      'main_hero',
      'main_hero_appearance_rate',
      'main_hero_ban_rate',
      'main_hero_win_rate',
      'main_heroid',
      '_updatedAt'
    ]
  };

  const bodyStr = JSON.stringify(payload);
  const stringToSign = ['POST', path, '', bodyStr].join('\n');
  const authSignature = crypto.createHmac('sha1', enigma).update(stringToSign).digest('hex');

  // 3. Post telemetry request
  const rankRes = await fetch(`https://api.gms.moontontech.com${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-AppId': appId,
      'X-ActId': actId,
      'X-Lang': 'en',
      'Authorization': authSignature
    },
    body: bodyStr
  });

  const rankData = await rankRes.json();
  return rankData.data.records.map(r => ({
    heroId: r.data.main_heroid,
    name: r.data.main_hero?.data?.name,
    avatar: r.data.main_hero?.data?.head,
    winRate: (r.data.main_hero_win_rate * 100).toFixed(2) + '%',
    pickRate: (r.data.main_hero_appearance_rate * 100).toFixed(2) + '%',
    banRate: (r.data.main_hero_ban_rate * 100).toFixed(2) + '%',
    updatedAt: new Date(r._updatedAt).toISOString()
  }));
}

fetchMLBBHeroStats(1, '7') // Past 1 day, Mythic rank
  .then(heroes => console.log(`Fetched ${heroes.length} heroes. Top hero:`, heroes[0]))
  .catch(console.error);
```

---

## 4. Network Security, CORS, and Rate Limits

### 4.1 CORS Feasibility

Both `/api/act/basev4` and `/api/gms/source/...` return explicit CORS headers:
```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET,HEAD,OPTIONS,POST,PUT,DELETE
Access-Control-Allow-Headers: content-type,DNT,X-CustomHeader,X-LANG,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,X-Api-Key,X-Device-Id,Access-Control-Allow-Origin,x-token,x-project-id,X-Token,sec-ch-ua,sec-ch-ua-mobile,sec-ch-ua-platform,x-appid,token,authorization,lang,actid,appid,x-agent,x-moa-token,ignorecanceltoken,x-actid,X-Location,XMLHttpRequest
Access-Control-Max-Age: 1728000
```
* **Browser Feasibility**: Yes, direct browser fetch is technically permitted by the preflight response.
* **Architecture Recommendation**: **DO NOT** invoke this from the end-user browser in production.
  1. Client-side requests expose the app to sudden breakage if Moonton rotates `appId` or restricts CORS.
  2. Moonton uses **Alibaba Cloud WAF** (`acw_tc` cookie challenge). High concurrent browser hits from diverse networks can trigger anti-bot challenges.
  3. Server-side fetching allows single-point caching and normalization.

### 4.2 Rate Limits & WAF

* **Alibaba Cloud WAF Protection**: Moonton routes traffic through Alibaba Cloud CDN and WAF. Every response injects `Set-Cookie: acw_tc=...`.
* **Rate Limit Profile**: There are no documented public quotas, but tests of rapid successive requests show no throttles up to ~30 requests/minute.
* **Polite Fetch Model**:
  Since Moonton's underlying data only refreshes **once every 24 hours** (daily aggregation run), polling more than once or twice a day provides zero statistical freshness. A server cron polling once every 12 hours consumes at most 10 requests/day total across all rank tiers.

---

## 5. Hero Metadata, Mappings, and Patch Versioning

### 5.1 Hero ID and Master Metadata Mapping

Moonton hosts an unauthenticated, publicly accessible static JSON repository containing all 134 MLBB heroes, their skills, portrait assets, lanes, and role archetypes:

* **URL**: `https://akmweb.youngjoygame.com/web/svnres/mlbb/homepage_2_1_41/latest/en_hero_list.json`
* **Method**: `GET` (CDN-cached, unauthenticated)
* **Localized Variants**: Change `en` to `id` (Indonesian), `ru` (Russian), `ph` (Tagalog), etc.
* **Total Heroes**: 134 (includes latest hero releases up to Marcel)

#### Sample Hero Schema:
```json
{
  "heroid": 1,
  "name": "Miya",
  "story": "The Priestess of the Moon...",
  "head": "https://akmweb.youngjoygame.com/web/svnres/img/mlbb/homepage/100_da894b37bfb5cadb32307f371f31918a.png",
  "squarehead": "https://akmweb.youngjoygame.com/web/svnres/file/mlbb/homepage/100_7c5b221cf1f95a1f06da1b7b644adfec.jpg",
  "sortlabel": ["Marksman", ""],
  "sortid": ["5", ""],
  "roadsortlabel": ["Gold Lane", ""],
  "roadsort": ["5", ""]
}
```

#### Canonical Role & Lane IDs

* **Role IDs (`sortid`)**:
  * `1`: Tank
  * `2`: Fighter
  * `3`: Assassin
  * `4`: Mage
  * `5`: Marksman
  * `6`: Support
* **Lane / Road IDs (`roadsort`)**:
  * `1`: EXP Lane
  * `2`: Mid Lane
  * `3`: Roam
  * `4`: Jungle
  * `5`: Gold Lane

### 5.2 Patch & Season Versioning

1. **Telemetry Update Frequency**: The `_updatedAt` timestamp on rank records updates **daily** (around 00:00 UTC / 08:00 GMT+8). The statistics represent rolling 24-hour, 3-day, 7-day, 15-day, or 30-day aggregate buckets.
2. **Client Patch Version Tracking**:
   * Official GMS stores game release milestones under `appId: 2665803` (`gms.content` news/version object).
   * Community API `arena.rone.dev` exposes this directly at:
     ```bash
     curl -s "https://arena.rone.dev/api/academy/meta/version"
     ```
     Returns active client versions: `{"game_version": "2.1.18"}, {"game_version": "1.9.90"}, ...`.
3. **Season Boundary Tracking**:
   Configured in `act_lang_en.json` (Key `2729807`: `season_start_time`), storing epoch millisecond timestamps for current rank season resets.

---

## 6. Community Free APIs & Scrapers

Several community tools exist with varying degrees of maintenance, reliability, and license terms.

### 6.1 Rone Arena API (`arena.rone.dev`)
* **Project Link**: [https://arena.rone.dev](https://arena.rone.dev) | [GitHub: ridwaanhall/rone-arena-api](https://github.com/ridwaanhall/rone-arena-api)
* **License**: BSD 3-Clause
* **Tech Stack**: Python 3.12, FastAPI, Cloudflare CDN
* **Freshness**: Real-time pass-through / cached proxy to Moonton GMS
* **Endpoints**:
  * `/api/heroes/rank?days=1&rank=mythic&size=200`: Full rank statistics across all tiers
  * `/api/academy/meta/version`: Current game version strings
  * `/api/heroes/{hero_identifier}/counters`: Dedicated counter-pick query
* **Pros**:
  * Standard REST API with OpenAPI/Swagger docs (`/api/openapi.json`)
  * Handles HMAC signing on their server; callers need zero auth
  * Actively used by production community sites (e.g. `mlbbdex.com`)
* **Cons**:
  * Third-party dependency hosted on a community domain; subject to uptime/bandwidth limits

### 6.2 Pren7 / MLBB-Winrate
* **Project Link**: [GitHub: Pren7/MLBB-Winrate](https://github.com/Pren7/MLBB-Winrate)
* **License**: ISC
* **Tech Stack**: Puppeteer (Headless Chrome) executing on GitHub Actions
* **Data URL**: `https://raw.githubusercontent.com/Pren7/MLBB-Winrate/main/winrate.json`
* **Freshness**: Updated daily at 17:00 UTC via scheduled workflow
* **Pros**: Simple raw JSON hosted on GitHub Raw CDN; extremely low chance of direct IP ban
* **Cons**:
  * Headless scraper is brittle (breaks whenever Moonton edits DOM class/ID names)
  * Only scrapes "All Ranks" (`bigrank: 101`) and Past 1 Day
  * Pre-formats numbers as strings (`"58.58%"`); lacks counter synergy deltas and hero IDs

---

## 7. Legal Analysis, Terms of Service (ToS), and Risk Profile

### 7.1 Moonton Terms of Service Review

From Moonton's official ToS (updated September 28, 2023, extracted from `act_lang_en.json` component `2677713`):
* **Prohibited Conduct Section**:
  > *"• use automated scripts, software, code or systems to collect information from or otherwise interact with the Services;"*  
  > *"• reverse engineer, disassemble, decompile or create any derivative works of the Services or any content included therein..."*
* **Personal / Non-Commercial Use Clause**:
  > *"Our Services are provided to you only for private, non-commercial use... Any commercial use of your UGC is prohibited without prior written consent."*

### 7.2 Legal & Risk Assessment

1. **Copyright Law (Factual Data)**:
   Under US and international copyright jurisprudence (*Feist Publications v. Rural Telephone Service*, *hiQ Labs v. LinkedIn*), raw statistical facts, match results, win rates, and pick rates cannot be protected by copyright. They are factual data derived from public gameplay. However, hero images, icons, and character lore are copyrighted assets of Moonton.
2. **CFAA / Anti-Hacking Law**:
   Following the US Supreme Court's ruling in *Van Buren v. United States* (2021) and the 9th Circuit decision in *hiQ Labs v. LinkedIn* (2022), scraping publicly accessible data without bypassing authentication/paywalls does not violate the Computer Fraud and Abuse Act (CFAA).
3. **Contractual / Account Risk**:
   The telemetry endpoint does **not require a logged-in player account** (`user.token` is not sent). Therefore, your or your users' personal MLBB game accounts face **zero risk of in-game ban or suspension**.
4. **Technical Enforcement Risk**:
   The only real risk is technical: Alibaba Cloud WAF IP blacklisting, rotation of `appId`/`actId`, or alteration of the `enigma` signing parameter.

---

## 8. Recommended Architectural Strategy for Tier-List MVP

### 8.1 Strategy Blueprint: Polite Server-Side Cron + Cache

```
[ Scheduled Cron: Every 12 Hours ]
               │
               ▼
   [ Fetch Direct GMS API ] ──(Fail?)──► [ Fallback 1: arena.rone.dev ]
               │                                      │
               │ (Success)                            │ (Success)
               ▼                                      ▼
   [ Validate & Normalize Schema (Zod / JSON Schema) ]
               │
               ▼
   [ Write to Local Storage (SQLite / Static JSON cache) ]
               │
               ▼
[ Tier-List Frontend (Never calls Moonton directly) ]
```

### 8.2 Fallback Strategy Hierarchy

1. **Primary: Direct Moonton GMS API via Server Cron**
   * Run a lightweight Node.js/Python script twice a day (00:30 UTC and 12:30 UTC).
   * Request `pageSize: 200` for Rank Tiers `7` (Mythic) and `101` (All).
   * Store results in a local database or static JSON file.
   * **Why**: Best data fidelity, full synergy deltas, independent of third-party community server uptime.
2. **Fallback 1: Rone Arena REST API (`arena.rone.dev/api/heroes/rank`)**
   * If GMS handshake fails (e.g. signature rejection or endpoint path migration), the cron job automatically retries against `https://arena.rone.dev/api/heroes/rank?days=1&rank=mythic&size=200`.
   * **Why**: Instant drop-in replacement with matching schema and zero maintenance.
3. **Fallback 2: Daily GitHub Raw Sync / Frozen Cache**
   * If both direct GMS and Rone Arena are unavailable, fall back to fetching `Pren7/MLBB-Winrate/main/winrate.json` or serve the most recent cached snapshot with a "Data as of [Date]" badge.
   * **Why**: Prevents tier-list UI outages; gaming tier lists remain largely valid across multi-week patch cycles.

### 8.3 Pros & Cons Comparison

| Strategy | Pros | Cons |
| :--- | :--- | :--- |
| **Direct Moonton GMS API** | • 100% primary source<br>• Zero middleman latency<br>• Full rank tier & synergy breakdown | • Requires maintaining HMAC-SHA1 signing helper<br>• Must monitor if `appId` updates |
| **Rone Arena REST API** | • Clean standard REST<br>• No signing required<br>• Exposes patch version endpoint | • Depends on community member's server uptime<br>• Rate limits on shared IP if unmonitored |
| **Headless Scraper (Puppeteer)** | • Visual emulation | • Heavy memory/CPU footprint<br>• Breaks easily on CSS/DOM changes |
| **Static GitHub Mirror** | • Indestructible CDN reliability | • Coarse rank data (All Ranks only)<br>• String percent format |

---

## 9. Appendix: Ready-to-Run Verification Commands

### Test 1: Fetch Moonton Enigma Key
```bash
curl -s "https://api.gms.moontontech.com/api/act/basev4" \
  -H "X-AppId: 2669606" \
  -H "X-ActId: 2669607" \
  -H "X-Lang: en"
```

### Test 2: Fetch Complete Hero Catalog (134 Heroes, Metadata, Skills, Avatars)
```bash
curl -s "https://akmweb.youngjoygame.com/web/svnres/mlbb/homepage_2_1_41/latest/en_hero_list.json"
```

### Test 3: Fetch Mythic Rank Statistics via Rone Arena Wrapper (All 133 Heroes)
```bash
curl -s "https://arena.rone.dev/api/heroes/rank?days=1&rank=mythic&size=200"
```

### Test 4: Fetch Active Game Client Patch Versions
```bash
curl -s "https://arena.rone.dev/api/academy/meta/version"
```
