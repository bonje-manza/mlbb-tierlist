import fs from 'node:fs/promises';
import path from 'node:path';
import { GMS_HOST, APP_ID, ACT_ID, fetchEnigma, generateGmsSignature } from './signer.ts';
import type { RankTier, TimeWindow, RawGmsRecord, RawGmsResponse } from '../types/index.ts';

export const GMS_SOURCE_IDS: Record<TimeWindow, string> = {
  '1d': '2756567',
  '3d': '2756568',
  '7d': '2756569',
  '15d': '2756565',
  '30d': '2756570'
};

export const GMS_BIGRANK_MAP: Record<RankTier, string> = {
  'all': '101',
  'epic': '5',
  'legend': '6',
  'mythic': '7',
  'honor': '8',
  'glory': '9'
};

export const RONE_ARENA_HOST = 'https://arena.rone.dev';
export const DEFAULT_AIRGAP_DIR = path.resolve('data/airgap');

export interface FetchTelemetryOptions {
  fetchFn?: typeof fetch;
  airgapDir?: string;
}

export interface TelemetryFetchResult {
  source: 'moonton-gms' | 'rone-arena' | 'airgap-snapshot';
  records: RawGmsRecord[];
  total: number;
  fetchedAt: string;
}

/**
 * 1. Primary: Direct Moonton GMS API fetch with HMAC-SHA1 signing
 */
export async function fetchMoontonRankTelemetry(
  rankTier: RankTier,
  timeWindow: TimeWindow,
  fetchFn: typeof fetch = fetch
): Promise<RawGmsRecord[]> {
  return fetchFromMoontonGms(rankTier, timeWindow, fetchFn);
}

async function fetchFromMoontonGms(
  rankTier: RankTier,
  timeWindow: TimeWindow,
  fetchFn: typeof fetch = fetch
): Promise<RawGmsRecord[]> {
  const handshake = await fetchEnigma(fetchFn);
  const sourceId = GMS_SOURCE_IDS[timeWindow];
  const bigrank = GMS_BIGRANK_MAP[rankTier];
  const reqPath = `/api/gms/source/${APP_ID}/${sourceId}`;

  const payload = {
    pageSize: 200,
    filters: [
      { field: 'bigrank', operator: 'eq', value: bigrank },
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
      'data.sub_hero.hero',
      'data.sub_hero.increase_win_rate',
      'data.sub_hero.heroid',
      '_updatedAt'
    ]
  };

  const bodyStr = JSON.stringify(payload);
  const signature = generateGmsSignature(reqPath, bodyStr, handshake.enigma);

  const res = await fetchFn(`${GMS_HOST}${reqPath}`, {
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

  if (!res.ok) {
    throw new Error(`Moonton GMS request failed with HTTP ${res.status} ${res.statusText}`);
  }

  const json = await res.json() as RawGmsResponse;
  if (json.code !== 0) {
    throw new Error(`Moonton GMS returned error code ${json.code}: ${json.message}`);
  }

  const records = json.data?.records;
  if (!Array.isArray(records) || records.length === 0) {
    throw new Error('Moonton GMS returned empty telemetry records array');
  }

  return records;
}

export function isRoneArenaSupported(rankTier: RankTier, timeWindow: TimeWindow): boolean {
  return (rankTier === 'mythic' || rankTier === 'all') && (timeWindow === '1d' || timeWindow === '7d');
}

/**
 * 2. Secondary: Rone Arena REST API fallback
 */
async function fetchFromRoneArena(
  rankTier: RankTier,
  timeWindow: TimeWindow,
  fetchFn: typeof fetch = fetch
): Promise<RawGmsRecord[]> {
  if (!isRoneArenaSupported(rankTier, timeWindow)) {
    throw new Error(`Rone Arena does not support rank "${rankTier}" or window "${timeWindow}"`);
  }
  const days = timeWindow === '1d' ? '1' : '7';
  const rank = rankTier === 'mythic' ? 'mythic' : 'all';
  const url = `${RONE_ARENA_HOST}/api/heroes/rank?days=${days}&rank=${rank}&size=200`;

  const res = await fetchFn(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  });

  if (!res.ok) {
    throw new Error(`Rone Arena API request failed with HTTP ${res.status} ${res.statusText}`);
  }

  const json = await res.json() as RawGmsResponse;
  if (json.code !== 0) {
    throw new Error(`Rone Arena API returned error code ${json.code}: ${json.message}`);
  }

  const records = json.data?.records;
  if (!Array.isArray(records) || records.length === 0) {
    throw new Error('Rone Arena API returned empty telemetry records array');
  }

  return records;
}

/**
 * 3. Tertiary: Airgap local disk snapshot fallback
 */
async function fetchFromAirgapSnapshot(
  rankTier: RankTier,
  timeWindow: TimeWindow,
  airgapDir: string = DEFAULT_AIRGAP_DIR
): Promise<RawGmsRecord[]> {
  const rawPath = path.join(airgapDir, `raw-${rankTier}-${timeWindow}.json`);

  try {
    const content = await fs.readFile(rawPath, 'utf8');
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as RawGmsRecord[];
    }
  } catch (err) {
    throw new Error(`Airgap snapshot not found or invalid at ${rawPath}: ${(err as Error).message}`);
  }

  throw new Error(`Airgap snapshot at ${rawPath} contained no records.`);
}

/**
 * Ingestion entrypoint executing 3-tier upstream failover hierarchy:
 * Moonton GMS -> Rone Arena -> Local Airgap Snapshot.
 */
export async function fetchRankTelemetryWithFailover(
  rankTier: RankTier,
  timeWindow: TimeWindow,
  options: FetchTelemetryOptions = {}
): Promise<TelemetryFetchResult> {
  const fetchFn = options.fetchFn || fetch;
  const airgapDir = options.airgapDir || DEFAULT_AIRGAP_DIR;

  // Primary: Moonton GMS
  try {
    const records = await fetchFromMoontonGms(rankTier, timeWindow, fetchFn);
    return {
      source: 'moonton-gms',
      records,
      total: records.length,
      fetchedAt: new Date().toISOString()
    };
  } catch (errGms) {
    console.warn(`[Failover] Moonton GMS primary failed: ${(errGms as Error).message}.`);
  }

  // Secondary: Rone Arena API (only for supported core tiers)
  if (isRoneArenaSupported(rankTier, timeWindow)) {
    try {
      const records = await fetchFromRoneArena(rankTier, timeWindow, fetchFn);
      return {
        source: 'rone-arena',
        records,
        total: records.length,
        fetchedAt: new Date().toISOString()
      };
    } catch (errRone) {
      console.warn(`[Failover] Rone Arena secondary failed: ${(errRone as Error).message}. Attempting Airgap snapshot...`);
    }
  } else {
    console.warn(`[Failover] Rone Arena bypassed (unsupported for rank="${rankTier}", window="${timeWindow}"). Attempting Airgap snapshot...`);
  }

  // Tertiary: Airgap snapshot
  const records = await fetchFromAirgapSnapshot(rankTier, timeWindow, airgapDir);
  return {
    source: 'airgap-snapshot',
    records,
    total: records.length,
    fetchedAt: new Date().toISOString()
  };
}
