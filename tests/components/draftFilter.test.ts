import { describe, it, expect } from 'vitest';
import { filterHeroesBySearch, sortHeroesByBanRate } from '../../src/utils/draftFilter.ts';
import { mockRafaela, mockGloo, mockMiya, mockChou, mockJulian } from './mockHeroes.ts';

describe('draftFilter utilities (Seam 0)', () => {
  const heroes = [mockRafaela, mockGloo, mockMiya, mockChou, mockJulian];

  describe('filterHeroesBySearch', () => {
    it('returns all heroes when query is empty or whitespace', () => {
      expect(filterHeroesBySearch(heroes, '')).toEqual(heroes);
      expect(filterHeroesBySearch(heroes, '   ')).toEqual(heroes);
    });

    it('matches hero name case-insensitively', () => {
      const resultLower = filterHeroesBySearch(heroes, 'gloo');
      expect(resultLower.map((h) => h.name)).toEqual(['Gloo']);

      const resultUpper = filterHeroesBySearch(heroes, 'GLOO');
      expect(resultUpper.map((h) => h.name)).toEqual(['Gloo']);

      const resultMixed = filterHeroesBySearch(heroes, 'cHoU');
      expect(resultMixed.map((h) => h.name)).toEqual(['Chou']);
    });

    it('matches partial substrings within hero names', () => {
      // 'fae' in 'Rafaela'
      const result = filterHeroesBySearch(heroes, 'fae');
      expect(result.map((h) => h.name)).toEqual(['Rafaela']);

      // 'ia' in 'Miya'
      const resultMiya = filterHeroesBySearch(heroes, 'iya');
      expect(resultMiya.map((h) => h.name)).toEqual(['Miya']);
    });

    it('returns empty array when no hero matches query', () => {
      const result = filterHeroesBySearch(heroes, 'NonExistentHero123');
      expect(result).toEqual([]);
    });

    it('does not mutate the source heroes array', () => {
      const copy = [...heroes];
      filterHeroesBySearch(heroes, 'Miya');
      expect(heroes).toEqual(copy);
    });
  });

  describe('sortHeroesByBanRate', () => {
    it('sorts heroes strictly in descending order of banRate', () => {
      // Gloo: 0.4879
      // Julian: 0.254
      // Miya: 0.2487
      // Rafaela: 0.1091
      // Chou: 0.082
      const sorted = sortHeroesByBanRate(heroes);
      const names = sorted.map((h) => h.name);
      expect(names).toEqual(['Gloo', 'Julian', 'Miya', 'Rafaela', 'Chou']);
      expect(sorted[0].banRate).toBeGreaterThan(sorted[1].banRate);
    });

    it('breaks ties using descending powerScore', () => {
      const tieHeroA = { ...mockChou, id: 901, name: 'HeroA', banRate: 0.2, powerScore: 70 };
      const tieHeroB = { ...mockChou, id: 902, name: 'HeroB', banRate: 0.2, powerScore: 85 };
      const tiedPool = [tieHeroA, tieHeroB];

      const sorted = sortHeroesByBanRate(tiedPool);
      expect(sorted.map((h) => h.name)).toEqual(['HeroB', 'HeroA']);
    });

    it('does not mutate the source array', () => {
      const original = [...heroes];
      sortHeroesByBanRate(heroes);
      expect(heroes).toEqual(original);
    });
  });
});
