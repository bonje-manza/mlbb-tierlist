import type { NormalizedHero, Lane, DamageType, CompositionDiagnostic } from '../types/index.ts';

// Known magic-damage heroes who are not canonically labeled only as Mage
const MAGIC_HERO_NAMES = new Set([
  'kimmy',
  'natan',
  'karina',
  'aamon',
  'joy',
  'gusion',
  'julian',
  'guinevere',
  'silvanna',
  'esmeralda',
  'phoveus',
  'johnson',
  'hylos',
  'belerick',
  'gloo',
  'uranus',
  'baxia',
  'angela',
  'estes',
  'rafaela',
  'floryn',
  'mathilda',
  'diggie',
  'carmilla',
  'faramis',
  'edith',
]);

/**
 * Infers the primary lane for a hero canonically from the first listed lane.
 * If empty, defaults to 'Mid Lane'.
 */
export function inferPrimaryLane(hero: NormalizedHero): Lane {
  if (hero.lanes && hero.lanes.length > 0) {
    return hero.lanes[0];
  }
  return 'Mid Lane';
}

/**
 * Determines primary damage type (Physical vs Magic).
 */
export function getHeroDamageType(hero: NormalizedHero): DamageType {
  const normalizedName = hero.name.toLowerCase().trim();
  if (MAGIC_HERO_NAMES.has(normalizedName)) {
    return 'Magic';
  }
  if (hero.roles && hero.roles.some((r) => String(r).toLowerCase().includes('mage'))) {
    return 'Magic';
  }
  return 'Physical';
}

/**
 * Checks if a hero qualifies as a frontline or peel anchor (Tank or durable Fighter).
 */
export function isFrontlineHero(hero: NormalizedHero): boolean {
  if (!hero.roles) return false;
  const isTank = hero.roles.some((r) => String(r).toLowerCase().includes('tank'));
  if (isTank) return true;

  const isDurableFighter = hero.roles.some((r) => String(r).toLowerCase().includes('fighter'));
  const isRoamOrExp = hero.lanes.some((l) => l === 'Roam' || l === 'EXP Lane');
  return isDurableFighter && isRoamOrExp;
}

/**
 * Checks if a hero is a pure marksman without secondary flex lane.
 */
export function isPureMarksman(hero: NormalizedHero): boolean {
  if (!hero.roles || !hero.lanes) return false;
  const isMm = hero.roles.some((r) => String(r).toLowerCase().includes('marksman'));
  return isMm && hero.lanes.length === 1 && hero.lanes[0] === 'Gold Lane';
}

export interface CompositionEvaluation {
  totalPenalty: number;
  diagnostics: CompositionDiagnostic[];
}

/**
 * Evaluates structural team composition health and generates penalties and diagnostics
 * based on ADR 0007.
 */
export function evaluateCompositionHygiene(teamHeroes: NormalizedHero[]): CompositionEvaluation {
  const diagnostics: CompositionDiagnostic[] = [];
  let totalPenalty = 0;

  if (!teamHeroes || teamHeroes.length === 0) {
    return { totalPenalty: 0, diagnostics: [] };
  }

  // 1. Damage Type Monoculture
  let physicalCount = 0;
  let magicCount = 0;

  for (const h of teamHeroes) {
    const dmg = getHeroDamageType(h);
    if (dmg === 'Magic') {
      magicCount++;
    } else {
      physicalCount++;
    }
  }

  if (physicalCount >= 4) {
    const penalty = 8.0;
    totalPenalty += penalty;
    diagnostics.push({
      type: 'warning',
      message: 'High Armor Vulnerability: 4+ Physical Damage Heroes',
      penalty,
    });
  } else if (magicCount >= 4) {
    const penalty = 8.0;
    totalPenalty += penalty;
    diagnostics.push({
      type: 'warning',
      message: 'Athena / Radiant Vulnerability: 4+ Magic Damage Heroes',
      penalty,
    });
  } else if (physicalCount >= 1 && magicCount >= 1 && teamHeroes.length >= 3) {
    diagnostics.push({
      type: 'success',
      message: 'Balanced Physical & Magic Damage Profile',
      penalty: 0,
    });
  }

  // 2. Retribution / Jungler Availability (Checked when team is full or near-full)
  const hasJungler = teamHeroes.some((h) => h.lanes && h.lanes.includes('Jungle'));
  if (teamHeroes.length === 5 && !hasJungler) {
    const penalty = 15.0;
    totalPenalty += penalty;
    diagnostics.push({
      type: 'warning',
      message: 'Fatal Objective Deficit: Missing Retribution / Jungler',
      penalty,
    });
  } else if (hasJungler) {
    diagnostics.push({
      type: 'info',
      message: 'Jungler Objective Secure Present',
      penalty: 0,
    });
  }

  // 3. Marksman Overlap (Multiple pure marksmen)
  const pureMmCount = teamHeroes.filter(isPureMarksman).length;
  if (pureMmCount > 1) {
    const penalty = 10.0;
    totalPenalty += penalty;
    diagnostics.push({
      type: 'warning',
      message: 'Marksman Overlap: Multiple Gold Laners reduce survivability',
      penalty,
    });
  }

  // 4. Frontline Deficit
  const frontlineCount = teamHeroes.filter(isFrontlineHero).length;
  if (teamHeroes.length >= 4 && frontlineCount === 0) {
    const penalty = 6.0;
    totalPenalty += penalty;
    diagnostics.push({
      type: 'warning',
      message: 'No Frontline: Team lacks durable engage or peel',
      penalty,
    });
  } else if (frontlineCount >= 1) {
    diagnostics.push({
      type: 'info',
      message: 'Frontline & Peel Present',
      penalty: 0,
    });
  }

  return {
    totalPenalty: Math.round(totalPenalty * 10) / 10,
    diagnostics,
  };
}
