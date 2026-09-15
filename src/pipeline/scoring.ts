import type {
  RankTier,
  TimeWindow,
  Tier,
  Lane,
  NormalizedHero,
  TierListDataset,
  RawGmsRecord,
  RawCatalogHero,
  SynergyPartner
} from '../types/index.ts';

export const DEFAULT_PATCH_VERSION = '2.1.41';

/**
 * Maps Moonton roadsort lane codes to canonical lane names:
 * 1 -> EXP Lane
 * 2 -> Mid Lane
 * 3 -> Roam
 * 4 -> Jungle
 * 5 -> Gold Lane
 */
export function mapRoadsortToLanes(roadsort?: string[]): Lane[] {
  if (!Array.isArray(roadsort)) return [];

  const laneMap: Record<string, Lane> = {
    '1': 'EXP Lane',
    '2': 'Mid Lane',
    '3': 'Roam',
    '4': 'Jungle',
    '5': 'Gold Lane'
  };

  const lanes: Lane[] = [];
  for (const code of roadsort) {
    const trimmed = String(code).trim();
    if (laneMap[trimmed] && !lanes.includes(laneMap[trimmed])) {
      lanes.push(laneMap[trimmed]);
    }
  }

  return lanes;
}

/**
 * Calculates Composite Power Score from Min-Max normalized metrics:
 * PowerScore = (WR_norm * 0.50) + (PR_norm * 0.25) + (BR_norm * 0.25)
 * Rounded to 1 decimal place.
 */
export function calculatePowerScore(wrNorm: number, prNorm: number, brNorm: number): number {
  const score = (wrNorm * 0.5) + (prNorm * 0.25) + (brNorm * 0.25);
  return Math.round(score * 10) / 10;
}

/**
 * Assigns tier bucket based on fixed score thresholds and niche dampening invariant:
 * - S+: PowerScore >= 85.0
 * - S:  75.0 <= PowerScore < 85.0
 * - A:  60.0 <= PowerScore < 75.0
 * - B:  45.0 <= PowerScore < 60.0
 * - C:  30.0 <= PowerScore < 45.0
 * - D:  PowerScore < 30.0
 *
 * Invariant: If raw Pick Rate < 0.5% (PR < 0.005), tier is capped at B Tier.
 */
export function assignTier(powerScore: number, pickRate: number): Tier {
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

  // Niche Pick Dampening Invariant:
  // Low-sample cheese picks with PR < 0.005 are capped at B Tier
  if (pickRate < 0.005 && (tier === 'S+' || tier === 'S' || tier === 'A')) {
    return 'B';
  }

  return tier;
}

/**
 * Extracts patch version from Moonton asset URL or returns default.
 */
export function extractPatchVersion(headUrl?: string): string {
  if (!headUrl) return DEFAULT_PATCH_VERSION;
  const match = headUrl.match(/homepage_(\d+)_(\d+)_(\d+)/);
  if (match) {
    return `${match[1]}.${match[2]}.${match[3]}`;
  }
  return DEFAULT_PATCH_VERSION;
}

export interface ProcessTelemetryOptions {
  rankTier: RankTier;
  timeWindow: TimeWindow;
  updatedAt?: string;
  patchVersion?: string;
}

/**
 * Pure function: processes raw hero match telemetry, normalizes metrics,
 * computes power scores, applies niche dampening, and produces a TierListDataset.
 */
export function processHeroTelemetry(
  records: RawGmsRecord[],
  catalog: RawCatalogHero[],
  options: ProcessTelemetryOptions
): TierListDataset {
  const catalogMap = new Map<number, RawCatalogHero>();
  for (const hero of catalog) {
    catalogMap.set(hero.heroid, hero);
  }

  if (records.length === 0) {
    return {
      updatedAt: options.updatedAt || new Date().toISOString(),
      patchVersion: options.patchVersion || DEFAULT_PATCH_VERSION,
      rankTier: options.rankTier,
      timeWindow: options.timeWindow,
      heroes: []
    };
  }

  // Determine Min and Max boundaries across active hero pool
  let minWr = Infinity;
  let maxWr = -Infinity;
  let minPr = Infinity;
  let maxPr = -Infinity;
  let minBr = Infinity;
  let maxBr = -Infinity;
  let detectedPatchVersion = options.patchVersion;
  let latestUpdatedAt: number | null = null;

  for (const rec of records) {
    const data = rec.data || {};
    const wr = data.main_hero_win_rate ?? 0;
    const pr = data.main_hero_appearance_rate ?? 0;
    const br = data.main_hero_ban_rate ?? 0;

    if (wr < minWr) minWr = wr;
    if (wr > maxWr) maxWr = wr;
    if (pr < minPr) minPr = pr;
    if (pr > maxPr) maxPr = pr;
    if (br < minBr) minBr = br;
    if (br > maxBr) maxBr = br;

    if (!detectedPatchVersion && data.main_hero?.data?.head) {
      const v = extractPatchVersion(data.main_hero.data.head);
      if (v !== DEFAULT_PATCH_VERSION) {
        detectedPatchVersion = v;
      }
    }

    if (rec._updatedAt) {
      const timeNum = typeof rec._updatedAt === 'number' ? rec._updatedAt : new Date(rec._updatedAt).getTime();
      if (!latestUpdatedAt || timeNum > latestUpdatedAt) {
        latestUpdatedAt = timeNum;
      }
    }
  }

  const patchVersion = detectedPatchVersion || DEFAULT_PATCH_VERSION;
  const updatedAt = options.updatedAt || (latestUpdatedAt ? new Date(latestUpdatedAt).toISOString() : new Date().toISOString());

  // Normalize each hero and assign power score and tier
  const normalizedHeroes: NormalizedHero[] = [];

  for (const rec of records) {
    const data = rec.data || {};
    const heroId = data.main_heroid;
    const catalogHero = catalogMap.get(heroId);

    const rawWr = data.main_hero_win_rate ?? 0;
    const rawPr = data.main_hero_appearance_rate ?? 0;
    const rawBr = data.main_hero_ban_rate ?? 0;

    const wrNorm = maxWr > minWr ? ((rawWr - minWr) / (maxWr - minWr)) * 100 : 0;
    const prNorm = maxPr > minPr ? ((rawPr - minPr) / (maxPr - minPr)) * 100 : 0;
    const brNorm = maxBr > minBr ? ((rawBr - minBr) / (maxBr - minBr)) * 100 : 0;

    const rawPowerScore = (wrNorm * 0.5) + (prNorm * 0.25) + (brNorm * 0.25);
    const powerScore = Math.round(rawPowerScore * 10) / 10;
    const tier = assignTier(rawPowerScore, rawPr);

    const name = data.main_hero?.data?.name || catalogHero?.name || `Hero #${heroId}`;
    const avatarUrl = data.main_hero?.data?.head || catalogHero?.head || '';

    // Multi-lane flex pick extraction from canonical catalog
    const lanes = catalogHero?.roadsort ? mapRoadsortToLanes(catalogHero.roadsort) : [];

    // Role tags from canonical catalog (filter empty strings)
    const roles = (catalogHero?.sortlabel || [])
      .map(r => r.trim())
      .filter(r => r.length > 0);

    // Extract Top 3 synergies with positive win-rate delta (increase_win_rate > 0)
    const rawSubHeroes = data.sub_hero || [];
    const synergies: SynergyPartner[] = rawSubHeroes
      .filter(sub => (sub.increase_win_rate ?? 0) > 0)
      .sort((a, b) => (b.increase_win_rate ?? 0) - (a.increase_win_rate ?? 0))
      .slice(0, 3)
      .map(sub => {
        const partnerCatalog = catalogMap.get(sub.heroid);
        return {
          heroId: sub.heroid,
          name: partnerCatalog?.name || `Hero #${sub.heroid}`,
          avatarUrl: sub.hero?.data?.head || partnerCatalog?.head || '',
          winRateDelta: Number(sub.increase_win_rate.toFixed(4))
        };
      });

    normalizedHeroes.push({
      id: heroId,
      name,
      avatarUrl,
      roles,
      lanes,
      winRate: Number(rawWr.toFixed(4)),
      pickRate: Number(rawPr.toFixed(4)),
      banRate: Number(rawBr.toFixed(4)),
      powerScore,
      tier,
      synergies
    });
  }

  // Sort descending by Power Score, then descending by Win Rate
  normalizedHeroes.sort((a, b) => {
    if (b.powerScore !== a.powerScore) {
      return b.powerScore - a.powerScore;
    }
    return b.winRate - a.winRate;
  });

  return {
    updatedAt,
    patchVersion,
    rankTier: options.rankTier,
    timeWindow: options.timeWindow,
    heroes: normalizedHeroes
  };
}
