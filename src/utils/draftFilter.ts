import type { NormalizedHero } from '../types/index.ts';

/**
 * Filters a pool of heroes by a case-insensitive substring search query against hero.name.
 * Returns the original array (or copy) unmodified if the query is empty or only whitespace.
 */
export function filterHeroesBySearch(
  heroes: NormalizedHero[],
  query: string
): NormalizedHero[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return heroes;
  }
  return heroes.filter((hero) => hero.name.toLowerCase().includes(trimmed));
}

/**
 * Sorts heroes strictly in descending order of banRate.
 * Ties are broken using powerScore descending.
 * Does not mutate the source array.
 */
export function sortHeroesByBanRate(heroes: NormalizedHero[]): NormalizedHero[] {
  return [...heroes].sort((a, b) => {
    if (b.banRate !== a.banRate) {
      return b.banRate - a.banRate;
    }
    return b.powerScore - a.powerScore;
  });
}
