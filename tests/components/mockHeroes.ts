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
  pickRate: 0.0148,
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

export const mockFaramis: NormalizedHero = {
  id: 76,
  name: 'Faramis',
  avatarUrl: 'https://akmweb.youngjoygame.com/web/svnres/img/test/faramis.png',
  roles: ['Support', 'Mage'],
  lanes: ['Mid Lane', 'Roam'],
  winRate: 0.5512,
  pickRate: 0.0125,
  banRate: 0.1834,
  powerScore: 81.3,
  tier: 'S',
  synergies: []
};

export const mockMultiLaneDataset: TierListDataset = {
  updatedAt: '2026-09-14T14:55:00.629Z',
  patchVersion: '2.1.88',
  rankTier: 'mythic',
  timeWindow: '1d',
  heroes: [mockRafaela, mockGloo, mockMiya, mockChou, mockJulian]
};

export const mockSynergyDataset: TierListDataset = {
  updatedAt: '2026-09-14T14:55:00.629Z',
  patchVersion: '2.1.88',
  rankTier: 'mythic',
  timeWindow: '1d',
  heroes: [mockRafaela, mockFaramis, mockMiya]
};

export const mockMythic1dDataset: TierListDataset = {
  updatedAt: '2026-09-14T14:55:00.629Z',
  patchVersion: '2.1.88',
  rankTier: 'mythic',
  timeWindow: '1d',
  heroes: [
    { ...mockRafaela, winRate: 0.5795, powerScore: 88.4, tier: 'S+' },
    { ...mockMiya, winRate: 0.5381, powerScore: 73.1, tier: 'A' },
    { ...mockChou, winRate: 0.512, powerScore: 68.5, tier: 'A' }
  ]
};

export const mockMythic7dDataset: TierListDataset = {
  updatedAt: '2026-09-14T12:00:00.000Z',
  patchVersion: '2.1.88',
  rankTier: 'mythic',
  timeWindow: '7d',
  heroes: [
    { ...mockRafaela, winRate: 0.562, powerScore: 85.1, tier: 'S+' },
    { ...mockMiya, winRate: 0.521, powerScore: 70.0, tier: 'A' },
    { ...mockChou, winRate: 0.505, powerScore: 65.2, tier: 'A' }
  ]
};

export const mockAll1dDataset: TierListDataset = {
  updatedAt: '2026-09-14T14:55:00.629Z',
  patchVersion: '2.1.88',
  rankTier: 'all',
  timeWindow: '1d',
  heroes: [
    { ...mockMiya, winRate: 0.556, powerScore: 79.5, tier: 'S' },
    { ...mockRafaela, winRate: 0.504, powerScore: 64.0, tier: 'A' },
    { ...mockChou, winRate: 0.491, powerScore: 59.8, tier: 'B' }
  ]
};

export const mockAll7dDataset: TierListDataset = {
  updatedAt: '2026-09-14T12:00:00.000Z',
  patchVersion: '2.1.88',
  rankTier: 'all',
  timeWindow: '7d',
  heroes: [
    { ...mockMiya, winRate: 0.542, powerScore: 76.0, tier: 'S' },
    { ...mockRafaela, winRate: 0.498, powerScore: 60.5, tier: 'A' },
    { ...mockChou, winRate: 0.488, powerScore: 58.1, tier: 'B' }
  ]
};

