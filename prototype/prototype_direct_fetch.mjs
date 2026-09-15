#!/usr/bin/env node
/**
 * PROTOTYPE: Direct Moonton GMS Hero Telemetry Fetch
 * Branch: prototype/direct-rank-fetch
 * 
 * Objective: Validate direct retrieval of live MLBB rank statistics from
 * Moonton's internal GMS endpoint (api.gms.moontontech.com) without third-party proxies.
 * 
 * Run with: node prototype/prototype_direct_fetch.mjs
 */

import crypto from 'node:crypto';
import { performance } from 'node:perf_hooks';

const GMS_HOST = 'https://api.gms.moontontech.com';
const APP_ID = '2669606';
const ACT_ID = '2669607';
const SOURCE_ID_1DAY = '2756567'; // Past 1 Day
const DEFAULT_PATCH_VERSION = '2.1.41'; // From canonical CDN hero list / homepage version

/**
 * 1. Handshake to retrieve dynamic HMAC signing key (enigma)
 */
async function fetchEnigma() {
  const start = performance.now();
  const res = await fetch(`${GMS_HOST}/api/act/basev4`, {
    method: 'GET',
    headers: {
      'X-AppId': APP_ID,
      'X-ActId': ACT_ID,
      'X-Lang': 'en'
    }
  });
  const latency = performance.now() - start;

  if (!res.ok) {
    throw new Error(`Enigma handshake failed: HTTP ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const enigma = json?.data?.server?.enigma;
  if (!enigma) {
    throw new Error('No enigma key found in basev4 handshake response');
  }

  return {
    enigma,
    serverTime: json.data?.server?.time,
    cdnPrefix: json.data?.client?.cdnPrefix,
    latencyMs: latency
  };
}

/**
 * 2. Fetch hero rank telemetry with HMAC-SHA1 signature
 */
async function fetchTelemetry(enigma, { pageSize = 10, rankTier = '7', sourceId = SOURCE_ID_1DAY } = {}) {
  const path = `/api/gms/source/${APP_ID}/${sourceId}`;
  const payload = {
    pageSize,
    filters: [
      { field: 'bigrank', operator: 'eq', value: rankTier }, // '7' = Mythic
      { field: 'match_type', operator: 'eq', value: 0 }      // Ranked
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
  const signature = crypto.createHmac('sha1', enigma).update(stringToSign).digest('hex');

  const start = performance.now();
  const res = await fetch(`${GMS_HOST}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-AppId': APP_ID,
      'X-ActId': ACT_ID,
      'X-Lang': 'en',
      'Authorization': signature
    },
    body: bodyStr
  });
  const latency = performance.now() - start;

  if (!res.ok) {
    throw new Error(`Telemetry fetch failed: HTTP ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  if (json.code !== 0) {
    throw new Error(`Moonton API returned error code ${json.code}: ${json.message}`);
  }

  return {
    records: json.data?.records || [],
    total: json.data?.total || 0,
    latencyMs: latency
  };
}

/**
 * Helper to derive version string from hero avatar head url or fallback
 */
function extractPatchVersion(headUrl) {
  if (!headUrl) return DEFAULT_PATCH_VERSION;
  const match = headUrl.match(/homepage_(\d+)_(\d+)_(\d+)/);
  if (match) {
    return `${match[1]}.${match[2]}.${match[3]}`;
  }
  return DEFAULT_PATCH_VERSION;
}

/**
 * 3. Probing Failure Modes
 */
async function probeFailureModes(validEnigma) {
  const results = [];

  // Failure Mode A: Invalid / corrupt HMAC Authorization signature
  try {
    const path = `/api/gms/source/${APP_ID}/${SOURCE_ID_1DAY}`;
    const payload = JSON.stringify({ pageSize: 1 });
    const res = await fetch(`${GMS_HOST}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AppId': APP_ID,
        'X-ActId': ACT_ID,
        'X-Lang': 'en',
        'Authorization': 'corrupt_invalid_signature_hex'
      },
      body: payload
    });
    const json = await res.json();
    results.push({
      scenario: 'Invalid HMAC Signature',
      expected: 'HTTP 401 or 403',
      actualHttp: res.status,
      apiCode: json.code,
      message: json.message,
      verdict: res.status === 200 && json.code === 0
        ? 'PERMISSIVE: Server accepts request without enforcing HMAC validity (client convention)'
        : 'ENFORCED: Server rejected bad signature'
    });
  } catch (err) {
    results.push({
      scenario: 'Invalid HMAC Signature',
      expected: 'Rejection',
      actualHttp: 'ERR',
      verdict: `Error: ${err.message}`
    });
  }

  // Failure Mode B: Non-existent / Invalid Source ID
  try {
    const badPath = `/api/gms/source/${APP_ID}/9999999`;
    const res = await fetch(`${GMS_HOST}${badPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AppId': APP_ID,
        'X-ActId': ACT_ID,
        'X-Lang': 'en'
      },
      body: JSON.stringify({ pageSize: 1 })
    });
    const text = await res.text();
    results.push({
      scenario: 'Invalid Source ID (Path 400)',
      expected: 'HTTP 400 / 404',
      actualHttp: res.status,
      apiCode: 'N/A',
      message: text || '(null body)',
      verdict: res.status === 400 ? 'HANDLED: Server returns HTTP 400 with null body' : `Unexpected HTTP ${res.status}`
    });
  } catch (err) {
    results.push({
      scenario: 'Invalid Source ID',
      actualHttp: 'ERR',
      verdict: `Error: ${err.message}`
    });
  }

  // Failure Mode C: Invalid Handshake Endpoint URL
  try {
    const res = await fetch(`${GMS_HOST}/api/act/non_existent_base_route`, {
      headers: { 'X-AppId': APP_ID, 'X-ActId': ACT_ID, 'X-Lang': 'en' }
    });
    const text = await res.text();
    results.push({
      scenario: 'Invalid Base Handshake Path',
      expected: 'HTTP 404',
      actualHttp: res.status,
      apiCode: 'N/A',
      message: text.trim(),
      verdict: res.status === 404 ? 'HANDLED: Moonton gateway returns HTTP 404 text' : `Unexpected HTTP ${res.status}`
    });
  } catch (err) {
    results.push({
      scenario: 'Invalid Base Path',
      actualHttp: 'ERR',
      verdict: `Error: ${err.message}`
    });
  }

  // Failure Mode D: Malformed (Non-JSON) Request Body
  try {
    const path = `/api/gms/source/${APP_ID}/${SOURCE_ID_1DAY}`;
    const res = await fetch(`${GMS_HOST}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AppId': APP_ID,
        'X-ActId': ACT_ID,
        'X-Lang': 'en'
      },
      body: 'this_is_not_valid_json'
    });
    const json = await res.json();
    results.push({
      scenario: 'Malformed JSON Payload',
      expected: 'HTTP 400 / JSON error code',
      actualHttp: res.status,
      apiCode: json.code,
      message: json.message,
      verdict: json.code === 400
        ? 'HANDLED: Server returns HTTP 200 with code: 400 payload ("invalid character...")'
        : `Unexpected payload: ${JSON.stringify(json)}`
    });
  } catch (err) {
    results.push({
      scenario: 'Malformed JSON Payload',
      actualHttp: 'ERR',
      verdict: `Error: ${err.message}`
    });
  }

  // Failure Mode E: Request Timeout via AbortSignal
  try {
    const timeoutSignal = AbortSignal.timeout(1); // 1ms intentional timeout
    await fetch(`${GMS_HOST}/api/act/basev4`, {
      signal: timeoutSignal,
      headers: { 'X-AppId': APP_ID, 'X-ActId': ACT_ID, 'X-Lang': 'en' }
    });
    results.push({
      scenario: 'Request Timeout Simulation',
      expected: 'TimeoutError / AbortError',
      actualHttp: '200',
      verdict: 'FAILED: Request completed within 1ms (unexpected)'
    });
  } catch (err) {
    const isTimeout = err.name === 'TimeoutError' || err.name === 'AbortError';
    results.push({
      scenario: 'Request Timeout Simulation',
      expected: 'TimeoutError / AbortError',
      actualHttp: 'ABORTED',
      apiCode: 'N/A',
      message: `${err.name}: ${err.message}`,
      verdict: isTimeout ? 'HANDLED: Client cleanly throws standard TimeoutError / AbortError' : `Unexpected error: ${err.message}`
    });
  }

  return results;
}

/**
 * Main execution
 */
async function main() {
  console.log('========================================================================');
  console.log(' PROTOTYPE: Direct Moonton GMS Rank Telemetry Fetch');
  console.log(' Target Endpoint: ' + GMS_HOST);
  console.log(' Timestamp: ' + new Date().toISOString());
  console.log('========================================================================\n');

  // --- Part 1: Repeated Live Fetch & Latency Measurements ---
  console.log('--- Step 1: Executing 3 Live End-to-End Fetches (Testing Repeatability & Latency) ---');
  const runMetrics = [];
  let latestRecords = [];

  for (let i = 1; i <= 3; i++) {
    const t0 = performance.now();
    const handshake = await fetchEnigma();
    const telemetry = await fetchTelemetry(handshake.enigma, { pageSize: 10, rankTier: '7' });
    const totalMs = performance.now() - t0;

    runMetrics.push({
      run: i,
      status: 'HTTP 200',
      handshakeMs: handshake.latencyMs.toFixed(1),
      telemetryMs: telemetry.latencyMs.toFixed(1),
      totalMs: totalMs.toFixed(1),
      enigmaSample: handshake.enigma.slice(0, 8) + '...',
      recordsRetrieved: telemetry.records.length
    });

    latestRecords = telemetry.records;
    // brief delay between test runs
    await new Promise(r => setTimeout(r, 250));
  }

  console.table(runMetrics);

  const avgTotal = (runMetrics.reduce((sum, r) => sum + parseFloat(r.totalMs), 0) / runMetrics.length).toFixed(1);
  const avgHandshake = (runMetrics.reduce((sum, r) => sum + parseFloat(r.handshakeMs), 0) / runMetrics.length).toFixed(1);
  const avgTelemetry = (runMetrics.reduce((sum, r) => sum + parseFloat(r.telemetryMs), 0) / runMetrics.length).toFixed(1);
  console.log(`Latency Summary: Avg Handshake = ${avgHandshake}ms | Avg Telemetry = ${avgTelemetry}ms | Avg Total E2E = ${avgTotal}ms\n`);

  // --- Part 2: Top 10 Heroes Formatted Table ---
  console.log('--- Step 2: Top 10 Heroes by Win Rate (Rank: Mythic, Window: Past 1 Day) ---');
  const formattedHeroes = latestRecords.map((rec, index) => {
    const data = rec.data || {};
    const hero = data.main_hero?.data || {};
    const winRate = (data.main_hero_win_rate * 100).toFixed(2) + '%';
    const pickRate = (data.main_hero_appearance_rate * 100).toFixed(2) + '%';
    const banRate = (data.main_hero_ban_rate * 100).toFixed(2) + '%';
    const patchVersion = extractPatchVersion(hero.head);
    const updatedAt = rec._updatedAt ? new Date(rec._updatedAt).toISOString() : 'N/A';

    return {
      Rank: index + 1,
      Hero: hero.name || `Hero #${data.main_heroid}`,
      'Winrate (%)': winRate,
      'Pickrate (%)': pickRate,
      'Banrate (%)': banRate,
      'Patch / Version': patchVersion,
      'Updated At (UTC)': updatedAt
    };
  });

  console.table(formattedHeroes);

  // Markdown format representation for easy copy/paste into tickets / documentation
  console.log('\nMarkdown Representation:');
  console.log('| Rank | Hero | Winrate | Pickrate | Banrate | Patch / Version | Updated At (UTC) |');
  console.log('| :--- | :--- | :--- | :--- | :--- | :--- | :--- |');
  for (const h of formattedHeroes) {
    console.log(`| ${h.Rank} | ${h.Hero} | ${h['Winrate (%)']} | ${h['Pickrate (%)']} | ${h['Banrate (%)']} | ${h['Patch / Version']} | ${h['Updated At (UTC)']} |`);
  }

  // --- Part 3: Failure Modes Probing & Analysis ---
  console.log('\n--- Step 3: Probing Endpoint Failure Modes & Error Envelopes ---');
  const handshake = await fetchEnigma();
  const failureProbes = await probeFailureModes(handshake.enigma);
  console.table(failureProbes.map(p => ({
    Scenario: p.scenario,
    'HTTP Status': p.actualHttp,
    'API Code': p.apiCode,
    'Verdict / Behavior': p.verdict
  })));

  console.log('\nDetailed Failure Mode Breakdown:');
  failureProbes.forEach((p, idx) => {
    console.log(` [${idx + 1}] ${p.scenario}`);
    console.log(`     - HTTP Status: ${p.actualHttp}`);
    console.log(`     - Response Body / Message: ${p.message}`);
    console.log(`     - Architectural Finding: ${p.verdict}\n`);
  });

  console.log('========================================================================');
  console.log(' PROTOTYPE EXECUTION COMPLETE: Direct fetch successfully verified.');
  console.log('========================================================================');
}

main().catch(err => {
  console.error('Fatal prototype error:', err);
  process.exit(1);
});
