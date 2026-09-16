import type { NormalizedHero, PowerScoreWeights, Tier, WeightPresetKey } from '../types/index.ts';

export const DEFAULT_WEIGHTS: PowerScoreWeights = {
  wr: 50,
  pr: 25,
  br: 25,
  dampenNiche: true,
};

export interface PresetDefinition {
  key: WeightPresetKey;
  label: string;
  description: string;
  weights: PowerScoreWeights;
}

export const PRESETS: Record<WeightPresetKey, PresetDefinition> = {
  default: {
    key: 'default',
    label: 'Default Meta',
    description: 'Official balanced meta (50% WR / 25% PR / 25% BR)',
    weights: { wr: 50, pr: 25, br: 25, dampenNiche: true },
  },
  pure_winrate: {
    key: 'pure_winrate',
    label: 'Pure Win Rate',
    description: 'Ranked solo performance without popularity bias (100% WR)',
    weights: { wr: 100, pr: 0, br: 0, dampenNiche: false },
  },
  ban_priority: {
    key: 'ban_priority',
    label: 'Ban Priority',
    description: 'Draft meta threat priority (30% WR / 20% PR / 50% BR)',
    weights: { wr: 30, pr: 20, br: 50, dampenNiche: true },
  },
  popularity: {
    key: 'popularity',
    label: 'High Popularity',
    description: 'Public queue acceptance (40% WR / 50% PR / 10% BR)',
    weights: { wr: 40, pr: 50, br: 10, dampenNiche: true },
  },
};

/**
 * Normalizes user-specified weights (0-100 each) into proportions summing to 1.0,
 * along with rounded percentages for UI display.
 * If total sum is 0, safely falls back to default 50/25/25 proportions.
 */
export function computeNormalizedWeights(weights: PowerScoreWeights): {
  wrWeight: number;
  prWeight: number;
  brWeight: number;
  wrPct: number;
  prPct: number;
  brPct: number;
} {
  const sum = Math.max(0, weights.wr) + Math.max(0, weights.pr) + Math.max(0, weights.br);

  if (sum <= 0) {
    return {
      wrWeight: 0.5,
      prWeight: 0.25,
      brWeight: 0.25,
      wrPct: 50,
      prPct: 25,
      brPct: 25,
    };
  }

  const wrWeight = Math.max(0, weights.wr) / sum;
  const prWeight = Math.max(0, weights.pr) / sum;
  const brWeight = Math.max(0, weights.br) / sum;

  const wrPct = Math.round(wrWeight * 100);
  const prPct = Math.round(prWeight * 100);
  const brPct = Math.round(brWeight * 100);

  return {
    wrWeight,
    prWeight,
    brWeight,
    wrPct,
    prPct,
    brPct,
  };
}

/**
 * Assigns tier bucket based on fixed score thresholds and optional niche dampening:
 * - S+: PowerScore >= 85.0
 * - S:  75.0 <= PowerScore < 85.0
 * - A:  60.0 <= PowerScore < 75.0
 * - B:  45.0 <= PowerScore < 60.0
 * - C:  30.0 <= PowerScore < 45.0
 * - D:  PowerScore < 30.0
 *
 * If dampenNiche is true: heroes with PR < 0.005 cannot exceed B tier.
 */
export function assignCustomTier(
  powerScore: number,
  pickRate: number,
  dampenNiche: boolean
): Tier {
  let tier: Tier;

  if (powerScore >= 85.0) {
    tier = 'S+';
  } else if (powerScore >= 75.0) {
    tier = 'S';
  } else if (powerScore >= 60.0) {
    tier = 'A';
  } else if (powerScore >= 45.0) {
    tier = 'B';
  } else if (powerScore >= 30.0) {
    tier = 'C';
  } else {
    tier = 'D';
  }

  if (dampenNiche && pickRate < 0.005 && (tier === 'S+' || tier === 'S' || tier === 'A')) {
    return 'B';
  }

  return tier;
}

/**
 * Checks whether the current weight configuration matches the default baseline.
 */
export function isDefaultWeights(weights: PowerScoreWeights): boolean {
  return (
    weights.wr === DEFAULT_WEIGHTS.wr &&
    weights.pr === DEFAULT_WEIGHTS.pr &&
    weights.br === DEFAULT_WEIGHTS.br &&
    weights.dampenNiche === DEFAULT_WEIGHTS.dampenNiche
  );
}

/**
 * Pure function: recalculates power scores, tiers, and re-sorts heroes
 * dynamically using custom weights and dampening settings.
 */
export function recalculateHeroPowerScores(
  heroes: NormalizedHero[],
  weights: PowerScoreWeights
): NormalizedHero[] {
  if (!heroes || heroes.length === 0) return [];

  // Determine Min and Max boundaries across active hero pool
  let minWr = Infinity;
  let maxWr = -Infinity;
  let minPr = Infinity;
  let maxPr = -Infinity;
  let minBr = Infinity;
  let maxBr = -Infinity;

  for (const hero of heroes) {
    if (hero.winRate < minWr) minWr = hero.winRate;
    if (hero.winRate > maxWr) maxWr = hero.winRate;
    if (hero.pickRate < minPr) minPr = hero.pickRate;
    if (hero.pickRate > maxPr) maxPr = hero.pickRate;
    if (hero.banRate < minBr) minBr = hero.banRate;
    if (hero.banRate > maxBr) maxBr = hero.banRate;
  }

  const { wrWeight, prWeight, brWeight } = computeNormalizedWeights(weights);

  const recalculated = heroes.map((hero) => {
    const wrNorm = maxWr > minWr ? ((hero.winRate - minWr) / (maxWr - minWr)) * 100 : 0;
    const prNorm = maxPr > minPr ? ((hero.pickRate - minPr) / (maxPr - minPr)) * 100 : 0;
    const brNorm = maxBr > minBr ? ((hero.banRate - minBr) / (maxBr - minBr)) * 100 : 0;

    const rawPowerScore = wrNorm * wrWeight + prNorm * prWeight + brNorm * brWeight;
    const powerScore = Math.round(rawPowerScore * 10) / 10;
    const tier = assignCustomTier(rawPowerScore, hero.pickRate, weights.dampenNiche);

    return {
      ...hero,
      powerScore,
      tier,
    };
  });

  // Sort descending by Power Score, then descending by Win Rate
  return recalculated.sort((a, b) => {
    if (b.powerScore !== a.powerScore) {
      return b.powerScore - a.powerScore;
    }
    return b.winRate - a.winRate;
  });
}
