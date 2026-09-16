import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeNormalizedWeights,
  assignCustomTier,
  isDefaultWeights,
  recalculateHeroPowerScores,
  DEFAULT_WEIGHTS,
  PRESETS,
} from '../src/utils/scoringEngine.ts';
import type { NormalizedHero } from '../src/types/index.ts';

const mockHeroes: NormalizedHero[] = [
  {
    id: 1,
    name: 'StandardMetaHero',
    avatarUrl: '',
    roles: ['Fighter'],
    lanes: ['EXP Lane'],
    winRate: 0.54,
    pickRate: 0.03, // 3%
    banRate: 0.20, // 20%
    powerScore: 70.0,
    tier: 'A',
    synergies: [],
  },
  {
    id: 2,
    name: 'NicheCheeseHero',
    avatarUrl: '',
    roles: ['Support'],
    lanes: ['Roam'],
    winRate: 0.58, // Highest win rate!
    pickRate: 0.002, // 0.2% (< 0.5% niche threshold)
    banRate: 0.01,
    powerScore: 60.0,
    tier: 'B',
    synergies: [],
  },
  {
    id: 3,
    name: 'MustBanHero',
    avatarUrl: '',
    roles: ['Assassin'],
    lanes: ['Jungle'],
    winRate: 0.51,
    pickRate: 0.02,
    banRate: 0.85, // Highest ban rate!
    powerScore: 80.0,
    tier: 'S',
    synergies: [],
  },
  {
    id: 4,
    name: 'UnderperformingHero',
    avatarUrl: '',
    roles: ['Marksman'],
    lanes: ['Gold Lane'],
    winRate: 0.44, // Lowest win rate
    pickRate: 0.01,
    banRate: 0.005,
    powerScore: 20.0,
    tier: 'D',
    synergies: [],
  },
];

test('computeNormalizedWeights correctly normalizes weights and percentages', () => {
  // 50 / 25 / 25
  const norm1 = computeNormalizedWeights({ wr: 50, pr: 25, br: 25, dampenNiche: true });
  assert.equal(norm1.wrWeight, 0.5);
  assert.equal(norm1.prWeight, 0.25);
  assert.equal(norm1.brWeight, 0.25);
  assert.equal(norm1.wrPct, 50);
  assert.equal(norm1.prPct, 25);
  assert.equal(norm1.brPct, 25);

  // Scaled 100 / 50 / 50 -> sum 200 -> 50% / 25% / 25%
  const norm2 = computeNormalizedWeights({ wr: 100, pr: 50, br: 50, dampenNiche: true });
  assert.equal(norm2.wrWeight, 0.5);
  assert.equal(norm2.prWeight, 0.25);
  assert.equal(norm2.brWeight, 0.25);
  assert.equal(norm2.wrPct, 50);
  assert.equal(norm2.prPct, 25);
  assert.equal(norm2.brPct, 25);

  // Pure Win Rate: 100 / 0 / 0
  const normPure = computeNormalizedWeights({ wr: 100, pr: 0, br: 0, dampenNiche: false });
  assert.equal(normPure.wrWeight, 1.0);
  assert.equal(normPure.prWeight, 0.0);
  assert.equal(normPure.brWeight, 0.0);
  assert.equal(normPure.wrPct, 100);
  assert.equal(normPure.prPct, 0);
  assert.equal(normPure.brPct, 0);

  // Degenerate zero sum: 0 / 0 / 0 -> fallback to 50/25/25
  const normZero = computeNormalizedWeights({ wr: 0, pr: 0, br: 0, dampenNiche: true });
  assert.equal(normZero.wrWeight, 0.5);
  assert.equal(normZero.prWeight, 0.25);
  assert.equal(normZero.brWeight, 0.25);
  assert.equal(normZero.wrPct, 50);
  assert.equal(normZero.prPct, 25);
  assert.equal(normZero.brPct, 25);
});

test('assignCustomTier handles score thresholds and niche dampening toggle', () => {
  // Normal pick rate (>= 0.005)
  assert.equal(assignCustomTier(86.0, 0.01, true), 'S+');
  assert.equal(assignCustomTier(78.0, 0.01, true), 'S');
  assert.equal(assignCustomTier(65.0, 0.01, true), 'A');
  assert.equal(assignCustomTier(50.0, 0.01, true), 'B');
  assert.equal(assignCustomTier(35.0, 0.01, true), 'C');
  assert.equal(assignCustomTier(25.0, 0.01, true), 'D');

  // Low pick rate (< 0.005) with dampening ON
  assert.equal(assignCustomTier(95.0, 0.002, true), 'B');
  assert.equal(assignCustomTier(79.0, 0.002, true), 'B');
  assert.equal(assignCustomTier(65.0, 0.002, true), 'B');
  assert.equal(assignCustomTier(50.0, 0.002, true), 'B');
  assert.equal(assignCustomTier(35.0, 0.002, true), 'C');

  // Low pick rate (< 0.005) with dampening OFF (User in control!)
  assert.equal(assignCustomTier(95.0, 0.002, false), 'S+');
  assert.equal(assignCustomTier(79.0, 0.002, false), 'S');
  assert.equal(assignCustomTier(65.0, 0.002, false), 'A');
});

test('isDefaultWeights correctly identifies default baseline', () => {
  assert.equal(isDefaultWeights(DEFAULT_WEIGHTS), true);
  assert.equal(isDefaultWeights({ wr: 50, pr: 25, br: 25, dampenNiche: true }), true);
  assert.equal(isDefaultWeights({ wr: 50, pr: 25, br: 25, dampenNiche: false }), false);
  assert.equal(isDefaultWeights({ wr: 60, pr: 20, br: 20, dampenNiche: true }), false);
});

test('recalculateHeroPowerScores re-ranks heroes and respects dampening toggle', () => {
  // With Pure Win Rate preset (100% WR, dampening OFF)
  const pureWrResults = recalculateHeroPowerScores(mockHeroes, PRESETS.pure_winrate.weights);
  assert.equal(pureWrResults.length, 4);

  // Highest win rate is NicheCheeseHero (0.58) -> WR_norm = 100 -> PowerScore = 100.0
  assert.equal(pureWrResults[0].name, 'NicheCheeseHero');
  assert.equal(pureWrResults[0].powerScore, 100.0);
  assert.equal(pureWrResults[0].tier, 'S+');

  // Lowest win rate is UnderperformingHero (0.44) -> WR_norm = 0 -> PowerScore = 0.0
  assert.equal(pureWrResults[pureWrResults.length - 1].name, 'UnderperformingHero');
  assert.equal(pureWrResults[pureWrResults.length - 1].powerScore, 0.0);
  assert.equal(pureWrResults[pureWrResults.length - 1].tier, 'D');

  // With Pure Win Rate BUT dampening ON:
  const pureWrDampened = recalculateHeroPowerScores(mockHeroes, {
    wr: 100,
    pr: 0,
    br: 0,
    dampenNiche: true,
  });
  const nicheHero = pureWrDampened.find((h) => h.name === 'NicheCheeseHero');
  assert.ok(nicheHero);
  assert.equal(nicheHero.powerScore, 100.0);
  assert.equal(nicheHero.tier, 'B'); // Capped at B despite 100.0 score!

  // With Ban Priority preset (50% BR, 30% WR, 20% PR)
  const banPriorityResults = recalculateHeroPowerScores(mockHeroes, PRESETS.ban_priority.weights);
  // MustBanHero has 85% ban rate -> should rank top
  assert.equal(banPriorityResults[0].name, 'MustBanHero');

  // Empty heroes list
  assert.deepEqual(recalculateHeroPowerScores([], DEFAULT_WEIGHTS), []);
});
