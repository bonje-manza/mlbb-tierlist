import test from 'node:test';
import assert from 'node:assert/strict';
import { processHeroTelemetry, calculatePowerScore, assignTier, mapRoadsortToLanes } from '../src/pipeline/scoring.ts';
import type { RawGmsRecord, RawCatalogHero } from '../src/types/index.ts';

test('mapRoadsortToLanes correctly maps roadsort IDs to canonical lane names', () => {
  assert.deepEqual(mapRoadsortToLanes(['5', '']), ['Gold Lane']);
  assert.deepEqual(mapRoadsortToLanes(['4']), ['Jungle']);
  assert.deepEqual(mapRoadsortToLanes(['3']), ['Roam']);
  assert.deepEqual(mapRoadsortToLanes(['2']), ['Mid Lane']);
  assert.deepEqual(mapRoadsortToLanes(['1']), ['EXP Lane']);
  // Multi-lane flex pick (e.g. Chou in EXP + Roam)
  assert.deepEqual(mapRoadsortToLanes(['1', '3']), ['EXP Lane', 'Roam']);
  // Unknown or empty
  assert.deepEqual(mapRoadsortToLanes(['', '99']), []);
  assert.deepEqual(mapRoadsortToLanes(undefined), []);
});

test('calculatePowerScore conforms to 50% WR_norm + 25% PR_norm + 25% BR_norm rounded to 1 decimal', () => {
  // Max across pool: WR=100, PR=100, BR=100 -> PowerScore = 100.0
  assert.equal(calculatePowerScore(100, 100, 100), 100.0);

  // Min across pool: WR=0, PR=0, BR=0 -> PowerScore = 0.0
  assert.equal(calculatePowerScore(0, 0, 0), 0.0);

  // 50% * 80 + 25% * 60 + 25% * 40 = 40 + 15 + 10 = 65.0
  assert.equal(calculatePowerScore(80, 60, 40), 65.0);

  // Test rounding: 50% * 83.333 + 25% * 66.666 + 25% * 33.333 = 41.6665 + 16.6665 + 8.33325 = 66.66625 -> 66.7
  assert.equal(calculatePowerScore(83.333, 66.666, 33.333), 66.7);
});

test('assignTier strictly respects boundary conditions and niche dampening', () => {
  // Normal pick rate (>= 0.005)
  assert.equal(assignTier(85.0, 0.01), 'S+');
  assert.equal(assignTier(100.0, 0.01), 'S+');
  assert.equal(assignTier(84.9, 0.01), 'S');
  assert.equal(assignTier(75.0, 0.01), 'S');
  assert.equal(assignTier(74.9, 0.01), 'A');
  assert.equal(assignTier(60.0, 0.01), 'A');
  assert.equal(assignTier(59.9, 0.01), 'B');
  assert.equal(assignTier(45.0, 0.01), 'B');
  assert.equal(assignTier(44.9, 0.01), 'C');
  assert.equal(assignTier(30.0, 0.01), 'C');
  assert.equal(assignTier(29.9, 0.01), 'D');
  assert.equal(assignTier(0.0, 0.01), 'D');

  // Niche Pick Dampening (pick rate < 0.005): Capped at B Tier!
  assert.equal(assignTier(95.0, 0.0049), 'B');
  assert.equal(assignTier(85.0, 0.001), 'B');
  assert.equal(assignTier(78.0, 0.002), 'B');
  assert.equal(assignTier(65.0, 0.003), 'B');
  assert.equal(assignTier(50.0, 0.002), 'B'); // Already B
  assert.equal(assignTier(35.0, 0.002), 'C'); // Below B remains C
  assert.equal(assignTier(20.0, 0.002), 'D'); // Below B remains D
});

test('processHeroTelemetry normalizes pool, extracts synergies, flex lanes, and produces TierListDataset', () => {
  const mockCatalog: RawCatalogHero[] = [
    {
      heroid: 1,
      name: 'Miya',
      head: 'https://cdn/miya.png',
      roadsort: ['5', ''],
      sortlabel: ['Marksman', '']
    },
    {
      heroid: 2,
      name: 'Chou',
      head: 'https://cdn/chou.png',
      roadsort: ['1', '3'],
      sortlabel: ['Fighter', '']
    },
    {
      heroid: 3,
      name: 'Lolita',
      head: 'https://cdn/lolita.png',
      roadsort: ['3'],
      sortlabel: ['Support', 'Tank']
    },
    {
      heroid: 4,
      name: 'Gloo',
      head: 'https://cdn/gloo.png',
      roadsort: ['1'],
      sortlabel: ['Tank']
    }
  ];

  const mockRecords: RawGmsRecord[] = [
    {
      _updatedAt: 1789400000000,
      data: {
        main_heroid: 1, // Miya: Mid WR, High PR, Low BR
        main_hero_win_rate: 0.50,
        main_hero_appearance_rate: 0.03,
        main_hero_ban_rate: 0.01,
        main_hero: { data: { name: 'Miya', head: 'https://cdn/homepage_2_1_41/miya.png' } },
        sub_hero: [
          { heroid: 2, increase_win_rate: 0.05, hero: { data: { head: 'https://cdn/chou.png' } } },
          { heroid: 3, increase_win_rate: -0.02, hero: { data: { head: 'https://cdn/lolita.png' } } }, // Negative should be excluded!
          { heroid: 4, increase_win_rate: 0.03, hero: { data: { head: 'https://cdn/gloo.png' } } }
        ]
      }
    },
    {
      _updatedAt: 1789400000000,
      data: {
        main_heroid: 2, // Chou: Multi-lane flex
        main_hero_win_rate: 0.52,
        main_hero_appearance_rate: 0.02,
        main_hero_ban_rate: 0.05,
        main_hero: { data: { name: 'Chou', head: 'https://cdn/homepage_2_1_41/chou.png' } }
      }
    },
    {
      _updatedAt: 1789400000000,
      data: {
        main_heroid: 3, // Lolita: High WR (0.59) & High BR (0.45) -> unconstrained Score ~67 (A Tier), but tiny PR (0.002) -> capped at B!
        main_hero_win_rate: 0.59,
        main_hero_appearance_rate: 0.002,
        main_hero_ban_rate: 0.45,
        main_hero: { data: { name: 'Lolita', head: 'https://cdn/homepage_2_1_41/lolita.png' } }
      }
    },
    {
      _updatedAt: 1789400000000,
      data: {
        main_heroid: 4, // Gloo: Highest WR (0.60), High BR (0.50), PR 0.025 -> God Tier S+
        main_hero_win_rate: 0.60,
        main_hero_appearance_rate: 0.025,
        main_hero_ban_rate: 0.50,
        main_hero: { data: { name: 'Gloo', head: 'https://cdn/homepage_2_1_41/gloo.png' } }
      }
    }
  ];

  const dataset = processHeroTelemetry(mockRecords, mockCatalog, {
    rankTier: 'mythic',
    timeWindow: '1d'
  });

  assert.equal(dataset.rankTier, 'mythic');
  assert.equal(dataset.timeWindow, '1d');
  assert.equal(dataset.patchVersion, '2.1.41');
  assert.equal(dataset.heroes.length, 4);

  // Gloo should be #1 and S+
  const gloo = dataset.heroes.find(h => h.id === 4)!;
  assert.ok(gloo);
  assert.equal(gloo.name, 'Gloo');
  assert.equal(gloo.tier, 'S+');
  assert.ok(gloo.powerScore >= 85.0);

  // Lolita has high WR (0.58) but PR=0.002 < 0.005 -> capped at B!
  const lolita = dataset.heroes.find(h => h.id === 3)!;
  assert.ok(lolita);
  assert.equal(lolita.tier, 'B');

  // Chou flex pick check
  const chou = dataset.heroes.find(h => h.id === 2)!;
  assert.ok(chou);
  assert.deepEqual(chou.lanes, ['EXP Lane', 'Roam']);

  // Miya synergy check: only positive deltas (heroid 2: +0.05, heroid 4: +0.03), negative (heroid 3: -0.02) excluded
  const miya = dataset.heroes.find(h => h.id === 1)!;
  assert.ok(miya);
  assert.equal(miya.synergies.length, 2);
  assert.equal(miya.synergies[0].heroId, 2);
  assert.equal(miya.synergies[0].name, 'Chou');
  assert.equal(miya.synergies[0].winRateDelta, 0.05);
  assert.equal(miya.synergies[1].heroId, 4);
  assert.equal(miya.synergies[1].name, 'Gloo');
  assert.equal(miya.synergies[1].winRateDelta, 0.03);

  // List should be sorted by powerScore descending
  for (let i = 1; i < dataset.heroes.length; i++) {
    assert.ok(dataset.heroes[i - 1].powerScore >= dataset.heroes[i].powerScore);
  }
});

test('processHeroTelemetry safely handles single hero pool without NaN or division by zero', () => {
  const singleRecord: RawGmsRecord[] = [{
    _updatedAt: 1789400000000,
    data: {
      main_heroid: 1,
      main_hero_win_rate: 0.50,
      main_hero_appearance_rate: 0.02,
      main_hero_ban_rate: 0.01,
      main_hero: { data: { name: 'Miya', head: 'https://cdn/miya.png' } }
    }
  }];
  const dataset = processHeroTelemetry(singleRecord, [], { rankTier: 'all', timeWindow: '7d' });
  assert.equal(dataset.heroes.length, 1);
  assert.ok(!Number.isNaN(dataset.heroes[0].powerScore));
  assert.ok(!Number.isNaN(dataset.heroes[0].winRate));
});
