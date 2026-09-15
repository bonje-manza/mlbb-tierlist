import type { Lane, LaneFilter, NormalizedHero } from '../types/index.ts';

export const LANE_FILTERS: LaneFilter[] = [
  'All',
  'Gold',
  'EXP',
  'Mid',
  'Roam',
  'Jungle',
];

export const LANE_FILTER_TO_CANONICAL: Record<Exclude<LaneFilter, 'All'>, Lane> = {
  Gold: 'Gold Lane',
  EXP: 'EXP Lane',
  Mid: 'Mid Lane',
  Roam: 'Roam',
  Jungle: 'Jungle',
};

export const LANE_FILTER_ACCESSIBLE_NAMES: Record<LaneFilter, string> = {
  All: 'All Lanes',
  Gold: 'Gold Lane',
  EXP: 'EXP Lane',
  Mid: 'Mid Lane',
  Roam: 'Roam',
  Jungle: 'Jungle',
};

/**
 * Checks whether a hero belongs to the selected lane filter.
 * - 'All' matches all heroes.
 * - Supports multi-lane flex-picks: matches if hero.lanes includes the canonical lane.
 */
export function isHeroInLane(hero: NormalizedHero, laneFilter: LaneFilter): boolean {
  if (laneFilter === 'All') return true;
  const canonicalLane = LANE_FILTER_TO_CANONICAL[laneFilter];
  return hero.lanes.includes(canonicalLane);
}

/**
 * Pure function: filters an array of heroes by lane filter, preserving existing order.
 */
export function filterHeroesByLane(
  heroes: NormalizedHero[],
  laneFilter: LaneFilter
): NormalizedHero[] {
  if (laneFilter === 'All') return heroes;
  return heroes.filter((hero) => isHeroInLane(hero, laneFilter));
}

/**
 * Calculates hero counts per lane filter, accounting for multi-lane flex-picks.
 */
export function calculateLaneCounts(heroes: NormalizedHero[]): Record<LaneFilter, number> {
  const counts: Record<LaneFilter, number> = {
    All: heroes.length,
    Gold: 0,
    EXP: 0,
    Mid: 0,
    Roam: 0,
    Jungle: 0,
  };

  for (const hero of heroes) {
    for (const filter of LANE_FILTERS) {
      if (filter !== 'All' && isHeroInLane(hero, filter)) {
        counts[filter] += 1;
      }
    }
  }

  return counts;
}
