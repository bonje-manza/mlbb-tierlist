import test from 'node:test';
import assert from 'node:assert/strict';
import {
  inferPrimaryLane,
  getHeroDamageType,
  isFrontlineHero,
  isPureMarksman,
  evaluateCompositionHygiene,
} from '../src/utils/draftHygiene.ts';
import type { NormalizedHero } from '../src/types/index.ts';

function createMockHero(overrides: Partial<NormalizedHero> = {}): NormalizedHero {
  return {
    id: 1,
    name: 'MockHero',
    avatarUrl: '',
    roles: ['Fighter'],
    lanes: ['EXP Lane'],
    winRate: 0.5,
    pickRate: 0.02,
    banRate: 0.05,
    powerScore: 60.0,
    tier: 'A',
    synergies: [],
    counters: [],
    ...overrides,
  };
}

test('inferPrimaryLane uses canonical first lane in array', () => {
  const hero1 = createMockHero({ lanes: ['Gold Lane', 'Mid Lane'] });
  assert.equal(inferPrimaryLane(hero1), 'Gold Lane');

  const hero2 = createMockHero({ lanes: ['Roam', 'EXP Lane'] });
  assert.equal(inferPrimaryLane(hero2), 'Roam');

  const heroEmpty = createMockHero({ lanes: [] });
  assert.equal(inferPrimaryLane(heroEmpty), 'Mid Lane');
});

test('getHeroDamageType correctly maps mages, magic assassins/marksmen, and physicals', () => {
  const layla = createMockHero({ name: 'Layla', roles: ['Marksman'], lanes: ['Gold Lane'] });
  assert.equal(getHeroDamageType(layla), 'Physical');

  const gord = createMockHero({ name: 'Gord', roles: ['Mage'], lanes: ['Mid Lane'] });
  assert.equal(getHeroDamageType(gord), 'Magic');

  const natan = createMockHero({ name: 'Natan', roles: ['Marksman'], lanes: ['Gold Lane'] });
  assert.equal(getHeroDamageType(natan), 'Magic');

  const gusion = createMockHero({ name: 'Gusion', roles: ['Assassin'], lanes: ['Mid Lane'] });
  assert.equal(getHeroDamageType(gusion), 'Magic');
});

test('isFrontlineHero recognizes tanks and durable fighters', () => {
  const tigreal = createMockHero({ name: 'Tigreal', roles: ['Tank'], lanes: ['Roam'] });
  assert.equal(isFrontlineHero(tigreal), true);

  const terizla = createMockHero({ name: 'Terizla', roles: ['Fighter'], lanes: ['EXP Lane'] });
  assert.equal(isFrontlineHero(terizla), true);

  const miya = createMockHero({ name: 'Miya', roles: ['Marksman'], lanes: ['Gold Lane'] });
  assert.equal(isFrontlineHero(miya), false);
});

test('isPureMarksman detects single-lane Gold Lane marksmen', () => {
  const beatrix = createMockHero({ roles: ['Marksman'], lanes: ['Gold Lane'] });
  assert.equal(isPureMarksman(beatrix), true);

  const flexChou = createMockHero({ roles: ['Fighter'], lanes: ['EXP Lane', 'Roam'] });
  assert.equal(isPureMarksman(flexChou), false);
});

test('evaluateCompositionHygiene detects 4+ physical damage monoculture', () => {
  const team: NormalizedHero[] = [
    createMockHero({ id: 1, name: 'Chou', roles: ['Fighter'], lanes: ['EXP Lane'] }),
    createMockHero({ id: 2, name: 'Saber', roles: ['Assassin'], lanes: ['Jungle'] }),
    createMockHero({ id: 3, name: 'Miya', roles: ['Marksman'], lanes: ['Gold Lane'] }),
    createMockHero({ id: 4, name: 'Tigreal', roles: ['Tank'], lanes: ['Roam'] }),
  ];

  const evalResult = evaluateCompositionHygiene(team);
  assert.ok(evalResult.totalPenalty >= 8.0);
  assert.ok(evalResult.diagnostics.some((d) => d.message.includes('High Armor Vulnerability')));
});

test('evaluateCompositionHygiene flags missing Retribution/Jungler at 5 heroes', () => {
  const team: NormalizedHero[] = [
    createMockHero({ id: 1, name: 'Chou', lanes: ['EXP Lane'], roles: ['Fighter'] }),
    createMockHero({ id: 2, name: 'Eudora', lanes: ['Mid Lane'], roles: ['Mage'] }),
    createMockHero({ id: 3, name: 'Miya', lanes: ['Gold Lane'], roles: ['Marksman'] }),
    createMockHero({ id: 4, name: 'Tigreal', lanes: ['Roam'], roles: ['Tank'] }),
    createMockHero({ id: 5, name: 'Gord', lanes: ['Mid Lane'], roles: ['Mage'] }),
  ];

  const evalResult = evaluateCompositionHygiene(team);
  assert.ok(evalResult.diagnostics.some((d) => d.message.includes('Missing Retribution / Jungler')));
  assert.ok(evalResult.totalPenalty >= 15.0);
});

test('evaluateCompositionHygiene recognizes balanced damage and frontline', () => {
  const team: NormalizedHero[] = [
    createMockHero({ id: 1, name: 'Terizla', lanes: ['EXP Lane'], roles: ['Fighter'] }),
    createMockHero({ id: 2, name: 'Pharsa', lanes: ['Mid Lane'], roles: ['Mage'] }),
    createMockHero({ id: 3, name: 'Ling', lanes: ['Jungle'], roles: ['Assassin'] }),
    createMockHero({ id: 4, name: 'Mathilda', lanes: ['Roam'], roles: ['Support'] }),
    createMockHero({ id: 5, name: 'Claude', lanes: ['Gold Lane'], roles: ['Marksman'] }),
  ];

  const evalResult = evaluateCompositionHygiene(team);
  assert.equal(evalResult.totalPenalty, 0);
  assert.ok(evalResult.diagnostics.some((d) => d.message.includes('Balanced Physical & Magic')));
  assert.ok(evalResult.diagnostics.some((d) => d.message.includes('Jungler Objective Secure Present')));
  assert.ok(evalResult.diagnostics.some((d) => d.message.includes('Frontline & Peel Present')));
});
