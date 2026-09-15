import fs from 'node:fs/promises';
import path from 'node:path';
import type { RawCatalogHero, RawCatalogResponse } from '../types/index.ts';

export const HERO_CATALOG_CDN_URL = 'https://akmweb.youngjoygame.com/web/svnres/mlbb/homepage_2_1_41/latest/en_hero_list.json';
export const DEFAULT_CATALOG_CACHE_PATH = path.resolve('data/airgap/catalog.json');

export interface FetchCatalogOptions {
  fetchFn?: typeof fetch;
  cachePath?: string;
}

/**
 * Fetches canonical hero metadata from Moonton CDN with local disk caching / airgap fallback.
 */
export async function fetchHeroCatalog(options: FetchCatalogOptions = {}): Promise<RawCatalogHero[]> {
  const fetchFn = options.fetchFn || fetch;
  const cachePath = options.cachePath || DEFAULT_CATALOG_CACHE_PATH;

  // 1. Try remote CDN
  try {
    const res = await fetchFn(HERO_CATALOG_CDN_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (res.ok) {
      const json = await res.json() as RawCatalogResponse;
      if (Array.isArray(json?.hero_list) && json.hero_list.length > 0) {
        // Asynchronously update local cache for future airgap resilience
        try {
          await fs.mkdir(path.dirname(cachePath), { recursive: true });
          await fs.writeFile(cachePath, JSON.stringify(json.hero_list, null, 2), 'utf8');
        } catch {
          // Non-fatal cache write failure
        }
        return json.hero_list;
      }
    }
  } catch (err) {
    console.warn(`[Catalog] Remote CDN fetch failed: ${(err as Error).message}. Attempting local airgap fallback...`);
  }

  // 2. Airgap disk fallback
  try {
    const cachedData = await fs.readFile(cachePath, 'utf8');
    const parsed = JSON.parse(cachedData);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as RawCatalogHero[];
    }
  } catch (err) {
    throw new Error(`Failed to load hero catalog from both remote CDN and local cache (${cachePath}): ${(err as Error).message}`);
  }

  throw new Error('Hero catalog was empty from both remote and cache sources.');
}
