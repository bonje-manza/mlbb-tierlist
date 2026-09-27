import type {
  NormalizedHero,
  LaneFilter,
  Lane,
  DraftRecommendation,
  PowerScoreWeights,
} from '../types/index.ts';
import { inferPrimaryLane, evaluateCompositionHygiene } from './draftHygiene.ts';
import { recalculateHeroPowerScores, isDefaultWeights } from './scoringEngine.ts';

export interface ComputeCdrOptions {
  customWeights?: PowerScoreWeights;
}

/**
 * Calculates net head-to-head empirical matchup delta (in percentage points)
 * between candidate hero and enemy hero:
 * Positive delta => Candidate counters enemy.
 * Negative delta => Enemy counters candidate.
 */
export function getHeroMatchupDelta(candidate: NormalizedHero, enemy: NormalizedHero): number {
  let advToEnemy = 0;
  let advFromEnemy = 0;

  // Check if candidate is in enemy's counter list (candidate counters enemy)
  if (enemy.counters) {
    const counterEntry = enemy.counters.find((c) => c.heroId === candidate.id);
    if (counterEntry) {
      advToEnemy = counterEntry.winRateDelta * 100;
    }
  }

  // Check if enemy is in candidate's counter list (enemy counters candidate)
  if (candidate.counters) {
    const counterEntry = candidate.counters.find((c) => c.heroId === enemy.id);
    if (counterEntry) {
      advFromEnemy = counterEntry.winRateDelta * 100;
    }
  }

  return advToEnemy - advFromEnemy;
}

/**
 * Calculates teammate synergy delta (in percentage points) between candidate and ally.
 */
export function getHeroSynergyDelta(candidate: NormalizedHero, ally: NormalizedHero): number {
  let synergy = 0;

  if (candidate.synergies) {
    const synEntry = candidate.synergies.find((s) => s.heroId === ally.id);
    if (synEntry) {
      synergy = Math.max(synergy, synEntry.winRateDelta * 100);
    }
  }

  if (ally.synergies) {
    const synEntry = ally.synergies.find((s) => s.heroId === candidate.id);
    if (synEntry) {
      synergy = Math.max(synergy, synEntry.winRateDelta * 100);
    }
  }

  return synergy;
}

/**
 * Computes the lane interaction weight:
 * - 1.4x for same inferred primary lane
 * - 1.2x if either hero is Roam or Jungle (high gank interaction)
 * - 1.0x for cross-lane non-roam
 */
export function getLaneInteractionWeight(candidate: NormalizedHero, enemy: NormalizedHero): number {
  const candidateLane = inferPrimaryLane(candidate);
  const enemyLane = inferPrimaryLane(enemy);

  if (candidateLane === enemyLane) {
    return 1.4;
  }

  if (
    candidateLane === 'Roam' ||
    candidateLane === 'Jungle' ||
    enemyLane === 'Roam' ||
    enemyLane === 'Jungle'
  ) {
    return 1.2;
  }

  return 1.0;
}

/**
 * Computes Composite Draft Rating (CDR) for a single hero candidate against
 * enemy and allied rosters according to ADR 0007.
 */
export function computeCompositeDraftRating(
  candidate: NormalizedHero,
  enemyHeroes: NormalizedHero[],
  allyHeroes: NormalizedHero[],
  options: ComputeCdrOptions = {}
): DraftRecommendation {
  const basePowerScore = candidate.powerScore;

  // 1. Counter Advantage & Kryptonite Non-Linear Hard-Counter Penalty
  let weightedCounterSum = 0;
  let maxDeficit = 0;
  let fatalEnemyName: string | undefined = undefined;

  for (const enemy of enemyHeroes) {
    const delta = getHeroMatchupDelta(candidate, enemy);
    const weight = getLaneInteractionWeight(candidate, enemy);
    weightedCounterSum += delta * weight;

    // Disadvantage against enemy (enemy counters candidate)
    const deficit = -delta;
    if (deficit > 3.5) {
      const overThreshold = deficit - 3.5;
      if (overThreshold > maxDeficit) {
        maxDeficit = overThreshold;
        fatalEnemyName = `${enemy.name} (-${deficit.toFixed(1)}%)`;
      }
    }
  }

  let kryptonitePenalty = 0;
  if (maxDeficit > 0) {
    kryptonitePenalty = Math.round(1.5 * Math.pow(maxDeficit, 1.2) * 10) / 10;
  }

  const counterAdvantage = Math.round((weightedCounterSum - kryptonitePenalty) * 10) / 10;

  // 2. Allied Pairing Synergy (alpha = 0.75)
  let rawSynergySum = 0;
  for (const ally of allyHeroes) {
    rawSynergySum += getHeroSynergyDelta(candidate, ally);
  }
  const synergyBonus = Math.round(rawSynergySum * 0.75 * 10) / 10;

  // 3. Composition Hygiene Evaluation
  const projectedTeam = [...allyHeroes, candidate];
  const hygiene = evaluateCompositionHygiene(projectedTeam);
  const compPenalty = hygiene.totalPenalty;

  // 4. Composite Draft Rating (CDR) Clamped to [0, 100]
  const rawCdr = basePowerScore + counterAdvantage + synergyBonus - compPenalty;
  const cdr = Math.min(100, Math.max(0, Math.round(rawCdr * 10) / 10));

  return {
    hero: candidate,
    cdr,
    powerScore: basePowerScore,
    counterAdvantage,
    synergyBonus,
    compPenalty,
    kryptonitePenalty,
    kryptoniteTarget: fatalEnemyName,
    diagnostics: hygiene.diagnostics,
  };
}

const LANE_FILTER_MAP: Record<LaneFilter, Lane | null> = {
  All: null,
  Gold: 'Gold Lane',
  EXP: 'EXP Lane',
  Mid: 'Mid Lane',
  Roam: 'Roam',
  Jungle: 'Jungle',
};

/**
 * Evaluates and sorts all available candidate heroes for the draft assistant view.
 * Strictly excludes already locked enemy and ally picks (Pick Exclusivity Invariant).
 */
export function rankDraftRecommendations(
  allHeroes: NormalizedHero[],
  enemyHeroes: NormalizedHero[],
  allyHeroes: NormalizedHero[],
  laneFilter: LaneFilter = 'All',
  options: ComputeCdrOptions = {}
): DraftRecommendation[] {
  if (!allHeroes || allHeroes.length === 0) return [];

  // Recalculate power scores if custom weights provided
  let pool = allHeroes;
  if (options.customWeights && !isDefaultWeights(options.customWeights)) {
    pool = recalculateHeroPowerScores(allHeroes, options.customWeights);
  }

  const lockedIds = new Set<number>([
    ...enemyHeroes.map((h) => h.id),
    ...allyHeroes.map((h) => h.id),
  ]);

  const targetLane = LANE_FILTER_MAP[laneFilter];

  // Exclude locked heroes and filter by lane if specified
  const candidates = pool.filter((hero) => {
    if (lockedIds.has(hero.id)) return false;
    if (targetLane && (!hero.lanes || !hero.lanes.includes(targetLane))) {
      return false;
    }
    return true;
  });

  const recommendations = candidates.map((hero) =>
    computeCompositeDraftRating(hero, enemyHeroes, allyHeroes, options)
  );

  // Sort descending by CDR, then counterAdvantage, then powerScore, then winRate
  return recommendations.sort((a, b) => {
    if (b.cdr !== a.cdr) {
      return b.cdr - a.cdr;
    }
    if (b.counterAdvantage !== a.counterAdvantage) {
      return b.counterAdvantage - a.counterAdvantage;
    }
    if (b.powerScore !== a.powerScore) {
      return b.powerScore - a.powerScore;
    }
    return b.hero.winRate - a.hero.winRate;
  });
}
