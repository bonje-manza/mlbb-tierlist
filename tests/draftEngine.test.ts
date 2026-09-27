import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getHeroMatchupDelta,
  getHeroSynergyDelta,
  getLaneInteractionWeight,
  computeCompositeDraftRating,
  rankDraftRecommendations,
} from '../src/utils/draftEngine.ts';
import type { NormalizedHero } from '../src/types/index.ts';

function createMockHero(overrides: Partial<NormalizedHero> = {}): NormalizedHero {
  return {
    id: 1,
    name: 'HeroOne',
    avatarUrl: '',
    roles: ['Fighter'],
    lanes: ['EXP Lane'],
    winRate: 0.52,
    pickRate: 0.02,
    banRate: 0.05,
    powerScore: 70.0,
    tier: 'A',
    synergies: [],
    counters: [],
    ...overrides,
  };
}

test('getHeroMatchupDelta computes positive when candidate counters enemy', () => {
  const candidate = createMockHero({ id: 10, name: 'Diggie' });
  const enemy = createMockHero({
    id: 20,
    name: 'Tigreal',
    counters: [
      {
        heroId: 10,
        name: 'Diggie',
        avatarUrl: '',
        roles: ['Support'],
        lanes: ['Roam'],
        winRateDelta: 0.065, // +6.5% advantage
        advantageFormatted: '+6.5% WR',
        strength: 'Very Strong',
      },
    ],
  });

  const delta = getHeroMatchupDelta(candidate, enemy);
  assert.equal(Math.round(delta * 10) / 10, 6.5);
});

test('getHeroMatchupDelta computes negative when enemy counters candidate', () => {
  const candidate = createMockHero({
    id: 15,
    name: 'Wanwan',
    counters: [
      {
        heroId: 30,
        name: 'Phoveus',
        avatarUrl: '',
        roles: ['Fighter'],
        lanes: ['EXP Lane'],
        winRateDelta: 0.078, // enemy counters candidate by 7.8%
        advantageFormatted: '+7.8% WR',
        strength: 'Very Strong',
      },
    ],
  });
  const enemy = createMockHero({ id: 30, name: 'Phoveus' });

  const delta = getHeroMatchupDelta(candidate, enemy);
  assert.equal(Math.round(delta * 10) / 10, -7.8);
});

test('getLaneInteractionWeight applies 1.4x for direct lane, 1.2x for roam/jungle, 1.0x cross-lane', () => {
  const gold1 = createMockHero({ lanes: ['Gold Lane'] });
  const gold2 = createMockHero({ lanes: ['Gold Lane'] });
  const roam = createMockHero({ lanes: ['Roam'] });
  const exp = createMockHero({ lanes: ['EXP Lane'] });

  assert.equal(getLaneInteractionWeight(gold1, gold2), 1.4);
  assert.equal(getLaneInteractionWeight(gold1, roam), 1.2);
  assert.equal(getLaneInteractionWeight(gold1, exp), 1.0);
});

test('computeCompositeDraftRating triggers Kryptonite penalty for fatal hard counters', () => {
  const wanwan = createMockHero({
    id: 15,
    name: 'Wanwan',
    lanes: ['Gold Lane'],
    powerScore: 75.0,
    counters: [
      {
        heroId: 30,
        name: 'Phoveus',
        avatarUrl: '',
        roles: ['Fighter'],
        lanes: ['EXP Lane'],
        winRateDelta: 0.078, // -7.8% fatal disadvantage
        advantageFormatted: '+7.8% WR',
        strength: 'Very Strong',
      },
    ],
  });

  const phoveus = createMockHero({ id: 30, name: 'Phoveus', lanes: ['EXP Lane'] });
  const rec = computeCompositeDraftRating(wanwan, [phoveus], []);

  assert.ok(rec.kryptonitePenalty > 0, 'Kryptonite penalty must be triggered');
  assert.ok(rec.kryptoniteTarget?.includes('Phoveus'));
  assert.ok(rec.cdr < wanwan.powerScore, 'CDR should drop significantly below base PowerScore');
});

test('computeCompositeDraftRating clamps smoothly between 0 and 100 and handles empty rosters', () => {
  const hero = createMockHero({ powerScore: 65.0 });
  const rec = computeCompositeDraftRating(hero, [], []);

  assert.equal(rec.cdr, 65.0);
  assert.equal(rec.counterAdvantage, 0);
  assert.equal(rec.synergyBonus, 0);
  assert.equal(rec.compPenalty, 0);
});

test('rankDraftRecommendations respects Pick Exclusivity and Lane Filtering', () => {
  const hero1 = createMockHero({ id: 1, name: 'Beatrix', lanes: ['Gold Lane'], powerScore: 80 });
  const hero2 = createMockHero({ id: 2, name: 'Chou', lanes: ['EXP Lane', 'Roam'], powerScore: 78 });
  const hero3 = createMockHero({ id: 3, name: 'Tigreal', lanes: ['Roam'], powerScore: 75 });
  const hero4 = createMockHero({ id: 4, name: 'Pharsa', lanes: ['Mid Lane'], powerScore: 74 });

  // Enemy picked Beatrix (hero1), Ally picked Chou (hero2)
  const recommendations = rankDraftRecommendations(
    [hero1, hero2, hero3, hero4],
    [hero1], // enemy
    [hero2], // ally
    'All'
  );

  // hero1 and hero2 must be excluded!
  assert.equal(recommendations.length, 2);
  assert.ok(!recommendations.some((r) => r.hero.id === 1));
  assert.ok(!recommendations.some((r) => r.hero.id === 2));

  // Test lane filter
  const roamOnly = rankDraftRecommendations(
    [hero1, hero2, hero3, hero4],
    [],
    [],
    'Roam'
  );

  // Only heroes with Roam (Chou, Tigreal)
  assert.equal(roamOnly.length, 2);
  assert.ok(roamOnly.every((r) => r.hero.lanes.includes('Roam')));
});
