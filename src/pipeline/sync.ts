import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchRankTelemetryWithFailover, DEFAULT_AIRGAP_DIR } from './fetcher.ts';
import { fetchHeroCatalog } from './catalog.ts';
import { processHeroTelemetry } from './scoring.ts';
import type { RankTier, TimeWindow, TierListDataset } from '../types/index.ts';

export const DEFAULT_OUTPUT_DIR = path.resolve('public/data');

export interface SyncOptions {
  fetchFn?: typeof fetch;
  outputDir?: string;
  airgapDir?: string;
  silent?: boolean;
}

export interface SyncPipelineResult {
  rankTier: RankTier;
  timeWindow: TimeWindow;
  source: string;
  heroCount: number;
  patchVersion: string;
  updatedAt: string;
  dataset: TierListDataset;
  filePath: string;
}

/**
 * Orchestrates full ingestion and scoring run for all permutations:
 * [mythic, all] x [1d, 7d]
 */
export async function executeSyncPipeline(options: SyncOptions = {}): Promise<SyncPipelineResult[]> {
  const outputDir = options.outputDir || DEFAULT_OUTPUT_DIR;
  const airgapDir = options.airgapDir || DEFAULT_AIRGAP_DIR;
  const fetchFn = options.fetchFn || fetch;
  const silent = options.silent ?? false;

  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(airgapDir, { recursive: true });

  const catalogCachePath = path.join(airgapDir, 'catalog.json');
  if (!silent) console.log(`[Sync] Loading canonical hero catalog...`);
  const catalog = await fetchHeroCatalog({ fetchFn, cachePath: catalogCachePath });
  if (!silent) console.log(`[Sync] Loaded ${catalog.length} catalog heroes.`);

  const ranks: RankTier[] = ['all', 'epic', 'legend', 'mythic', 'honor', 'glory'];
  const windows: TimeWindow[] = ['1d', '3d', '7d', '15d', '30d'];

  const permutations: Array<{ rank: RankTier; window: TimeWindow }> = [];
  for (const rank of ranks) {
    for (const window of windows) {
      permutations.push({ rank, window });
    }
  }

  const results: SyncPipelineResult[] = [];

  for (const { rank, window } of permutations) {
    if (results.length > 0) {
      await new Promise((res) => setTimeout(res, 100));
    }

    if (!silent) {
      console.log(`\n[Sync] ── Ingesting rank="${rank}", window="${window}" ──`);
    }

    const telemetry = await fetchRankTelemetryWithFailover(rank, window, {
      fetchFn,
      airgapDir
    });

    if (!silent) {
      console.log(`[Sync] Telemetry received from: [${telemetry.source}] (${telemetry.records.length} records)`);
    }

    // Save raw records to airgap directory for offline resilience
    const rawAirgapPath = path.join(airgapDir, `raw-${rank}-${window}.json`);
    try {
      await fs.writeFile(rawAirgapPath, JSON.stringify(telemetry.records, null, 2), 'utf8');
    } catch (err) {
      if (!silent) console.warn(`[Sync] Warning: Failed to write raw airgap cache: ${(err as Error).message}`);
    }

    // Run pure normalization & scoring engine
    const dataset = processHeroTelemetry(telemetry.records, catalog, {
      rankTier: rank,
      timeWindow: window
    });

    const fileName = `tierlist-${rank}-${window}.json`;
    const targetPath = path.join(outputDir, fileName);
    const jsonOutput = JSON.stringify(dataset, null, 2);

    await fs.writeFile(targetPath, jsonOutput, 'utf8');

    // Also persist static dataset snapshot into airgap directory
    const airgapDatasetPath = path.join(airgapDir, fileName);
    await fs.writeFile(airgapDatasetPath, jsonOutput, 'utf8');

    // If default primary (mythic 1d), also copy to meta-tierlist.json at public root
    if (rank === 'mythic' && window === '1d') {
      const metaPath = path.resolve(outputDir, '..', 'meta-tierlist.json');
      await fs.writeFile(metaPath, jsonOutput, 'utf8');
      if (!silent) console.log(`[Sync] Generated primary alias: ${metaPath}`);
    }

    results.push({
      rankTier: rank,
      timeWindow: window,
      source: telemetry.source,
      heroCount: dataset.heroes.length,
      patchVersion: dataset.patchVersion,
      updatedAt: dataset.updatedAt,
      dataset,
      filePath: targetPath
    });

    if (!silent) {
      const tierCounts: Record<string, number> = { 'S+': 0, 'S': 0, 'A': 0, 'B': 0, 'C': 0, 'D': 0 };
      for (const h of dataset.heroes) {
        tierCounts[h.tier] = (tierCounts[h.tier] || 0) + 1;
      }
      console.log(`[Sync] Tier distribution: S+:${tierCounts['S+']} | S:${tierCounts['S']} | A:${tierCounts['A']} | B:${tierCounts['B']} | C:${tierCounts['C']} | D:${tierCounts['D']}`);
      console.log(`[Sync] Top 3 Heroes:`);
      dataset.heroes.slice(0, 3).forEach((h, idx) => {
        console.log(`  ${idx + 1}. [${h.tier}] ${h.name.padEnd(14)} PowerScore: ${h.powerScore.toFixed(1).padStart(5)} | WR: ${(h.winRate * 100).toFixed(2)}% | PR: ${(h.pickRate * 100).toFixed(2)}% | BR: ${(h.banRate * 100).toFixed(2)}% | Lanes: ${h.lanes.join(', ')}`);
      });
    }
  }

  return results;
}

// Direct CLI execution guard
const currentFile = fileURLToPath(import.meta.url);
const executedFile = process.argv[1] ? path.resolve(process.argv[1]) : '';

if (executedFile === currentFile || executedFile.endsWith('sync.ts')) {
  console.log('========================================================================');
  console.log(' MLBB Hero Tier List Telemetry Sync Pipeline');
  console.log(' Timestamp: ' + new Date().toISOString());
  console.log('========================================================================');

  executeSyncPipeline()
    .then(results => {
      console.log('\n========================================================================');
      console.log(` SUCCESS: All ${results.length} datasets generated successfully.`);
      console.log('========================================================================\n');
    })
    .catch(err => {
      console.error('\n[FATAL ERROR] Ingestion sync pipeline failed:', err);
      process.exit(1);
    });
}
