import { describe, it, expect } from 'vitest';
import {
  isHeroInLane,
  filterHeroesByLane,
  calculateLaneCounts,
  LANE_FILTERS,
} from '../../src/utils/laneFilter.ts';
import {
  mockRafaela,
  mockGloo,
  mockMiya,
  mockChou,
  mockJulian,
} from './mockHeroes.ts';

describe('laneFilter (Seam 0)', () => {
  const heroes = [mockRafaela, mockGloo, mockMiya, mockChou, mockJulian];

  it('defines all canonical lane filters in draft order', () => {
    expect(LANE_FILTERS).toEqual(['All', 'Gold', 'EXP', 'Mid', 'Roam', 'Jungle']);
  });

  it('matches all heroes when lane filter is "All"', () => {
    expect(isHeroInLane(mockRafaela, 'All')).toBe(true);
    expect(isHeroInLane(mockMiya, 'All')).toBe(true);
    expect(isHeroInLane(mockChou, 'All')).toBe(true);
    expect(filterHeroesByLane(heroes, 'All')).toHaveLength(5);
  });

  it('matches single-lane heroes only for their assigned lane', () => {
    // Miya is Gold Lane
    expect(isHeroInLane(mockMiya, 'Gold')).toBe(true);
    expect(isHeroInLane(mockMiya, 'EXP')).toBe(false);
    expect(isHeroInLane(mockMiya, 'Mid')).toBe(false);
    expect(isHeroInLane(mockMiya, 'Roam')).toBe(false);
    expect(isHeroInLane(mockMiya, 'Jungle')).toBe(false);

    // Rafaela is Roam
    expect(isHeroInLane(mockRafaela, 'Roam')).toBe(true);
    expect(isHeroInLane(mockRafaela, 'Gold')).toBe(false);
  });

  it('matches multi-lane flex-pick heroes across all assigned lanes', () => {
    // Chou is EXP Lane + Roam
    expect(isHeroInLane(mockChou, 'EXP')).toBe(true);
    expect(isHeroInLane(mockChou, 'Roam')).toBe(true);
    expect(isHeroInLane(mockChou, 'Gold')).toBe(false);
    expect(isHeroInLane(mockChou, 'Mid')).toBe(false);
    expect(isHeroInLane(mockChou, 'Jungle')).toBe(false);

    // Julian is Mid Lane + Jungle
    expect(isHeroInLane(mockJulian, 'Mid')).toBe(true);
    expect(isHeroInLane(mockJulian, 'Jungle')).toBe(true);
    expect(isHeroInLane(mockJulian, 'EXP')).toBe(false);
    expect(isHeroInLane(mockJulian, 'Gold')).toBe(false);
  });

  it('calculates lane counts including flex-picks across multiple lanes', () => {
    const counts = calculateLaneCounts(heroes);

    expect(counts).toEqual({
      All: 5,
      Gold: 1,   // Miya
      EXP: 2,    // Gloo, Chou
      Mid: 1,    // Julian
      Roam: 2,   // Rafaela, Chou
      Jungle: 1, // Julian
    });
  });
});
