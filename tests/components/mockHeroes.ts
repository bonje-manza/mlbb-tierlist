import type { NormalizedHero, TierListDataset } from '../../src/types/index.ts';

export const mockRafaela: NormalizedHero = {
  id: 14,
  name: 'Rafaela',
  avatarUrl: 'https://akmweb.youngjoygame.com/web/svnres/img/test/rafaela.png',
  roles: ['Support'],
  lanes: ['Roam'],
  winRate: 0.5795,
  pickRate: 0.0089,
  banRate: 0.1091,
  powerScore: 88.4,
  tier: 'S+',
  synergies: [
    {
      heroId: 76,
      name: 'Faramis',
      avatarUrl: 'https://akmweb.youngjoygame.com/web/svnres/img/test/faramis.png',
      winRateDelta: 0.0262
    }
  ]
};

export const mockGloo: NormalizedHero = {
  id: 104,
  name: 'Gloo',
  avatarUrl: 'https://akmweb.youngjoygame.com/web/svnres/img/test/gloo.png',
  roles: ['Tank'],
  lanes: ['EXP Lane'],
  winRate: 0.5667,
  pickRate: 0.0048,
  banRate: 0.4879,
  powerScore: 86.2,
  tier: 'S+',
  synergies: []
};

export const mockMiya: NormalizedHero = {
  id: 1,
  name: 'Miya',
  avatarUrl: 'https://akmweb.youngjoygame.com/web/svnres/img/test/miya.png',
  roles: ['Marksman'],
  lanes: ['Gold Lane'],
  winRate: 0.5381,
  pickRate: 0.0402,
  banRate: 0.2487,
  powerScore: 73.1,
  tier: 'A',
  synergies: []
};

export const mockChou: NormalizedHero = {
  id: 26,
  name: 'Chou',
  avatarUrl: 'https://akmweb.youngjoygame.com/web/svnres/img/test/chou.png',
  roles: ['Fighter'],
  lanes: ['EXP Lane', 'Roam'],
  winRate: 0.512,
  pickRate: 0.035,
  banRate: 0.082,
  powerScore: 68.5,
  tier: 'A',
  synergies: []
};

export const mockJulian: NormalizedHero = {
  id: 115,
  name: 'Julian',
  avatarUrl: 'https://akmweb.youngjoygame.com/web/svnres/img/test/julian.png',
  roles: ['Mage', 'Fighter'],
  lanes: ['Mid Lane', 'Jungle'],
  winRate: 0.545,
  pickRate: 0.021,
  banRate: 0.254,
  powerScore: 78.9,
  tier: 'S',
  synergies: []
};

export const mockDataset: TierListDataset = {
  updatedAt: '2026-09-14T14:55:00.629Z',
  patchVersion: '2.1.88',
  rankTier: 'mythic',
  timeWindow: '1d',
  heroes: [mockRafaela, mockMiya]
};

export const mockMultiLaneDataset: TierListDataset = {
  updatedAt: '2026-09-14T14:55:00.629Z',
  patchVersion: '2.1.88',
  rankTier: 'mythic',
  timeWindow: '1d',
  heroes: [mockRafaela, mockGloo, mockMiya, mockChou, mockJulian]
};

