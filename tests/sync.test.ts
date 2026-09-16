import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { executeSyncPipeline } from '../src/pipeline/sync.ts';
import type { RawGmsRecord, RawCatalogHero, TierListDataset } from '../src/types/index.ts';

test('executeSyncPipeline generates all 4 permutations and meta-tierlist.json', async () => {
  const tmpOutputDir = path.resolve('tests/fixtures/output');
  const tmpAirgapDir = path.resolve('tests/fixtures/sync_airgap');

  const mockCatalog: RawCatalogHero[] = [
    {
      heroid: 1,
      name: 'Miya',
      head: 'https://cdn/homepage_2_1_41/miya.png',
      roadsort: ['5'],
      sortlabel: ['Marksman']
    }
  ];

  const mockRecords: RawGmsRecord[] = [
    {
      _updatedAt: 1789400000000,
      data: {
        main_heroid: 1,
        main_hero_win_rate: 0.52,
        main_hero_appearance_rate: 0.03,
        main_hero_ban_rate: 0.01,
        main_hero: { data: { name: 'Miya', head: 'https://cdn/homepage_2_1_41/miya.png' } }
      }
    }
  ];

  const mockFetch = async (url: string | URL | Request) => {
    const urlStr = url.toString();
    if (urlStr.includes('/api/act/basev4')) {
      return new Response(JSON.stringify({ code: 0, data: { server: { enigma: 'test-enigma' } } }), { status: 200 });
    }
    if (urlStr.includes('/api/gms/source/')) {
      return new Response(JSON.stringify({ code: 0, data: { records: mockRecords, total: 1 } }), { status: 200 });
    }
    if (urlStr.includes('en_hero_list.json')) {
      return new Response(JSON.stringify({ hero_list: mockCatalog }), { status: 200 });
    }
    return new Response('Not Found', { status: 404 });
  };

  const results = await executeSyncPipeline({
    fetchFn: mockFetch as any,
    outputDir: tmpOutputDir,
    airgapDir: tmpAirgapDir
  });

  assert.equal(results.length, 30);

  // Check expected files exist on disk
  const ranks = ['all', 'epic', 'legend', 'mythic', 'honor', 'glory'];
  const windows = ['1d', '3d', '7d', '15d', '30d'];
  const expectedFiles: string[] = ['../meta-tierlist.json'];
  for (const r of ranks) {
    for (const w of windows) {
      expectedFiles.push(`tierlist-${r}-${w}.json`);
    }
  }

  for (const file of expectedFiles) {
    const filePath = path.resolve(tmpOutputDir, file);
    const content = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(content) as TierListDataset;
    assert.ok(parsed.updatedAt);
    assert.equal(parsed.patchVersion, '2.1.41');
    assert.equal(parsed.heroes.length, 1);
    assert.equal(parsed.heroes[0].name, 'Miya');
    assert.deepEqual(parsed.heroes[0].lanes, ['Gold Lane']);
  }

  // Clean up
  await fs.rm(path.resolve('tests/fixtures'), { recursive: true, force: true });
});
