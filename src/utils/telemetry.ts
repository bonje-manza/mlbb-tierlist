import type { NormalizedHero } from '../types/index.ts';

export interface TelemetryBounds {
  minWr: number;
  maxWr: number;
  minPr: number;
  maxPr: number;
  minBr: number;
  maxBr: number;
}

/**
 * Calculates pool-wide min and max boundaries for Win Rate, Pick Rate, and Ban Rate.
 */
export function calculateTelemetryBounds(heroes?: NormalizedHero[]): TelemetryBounds {
  if (!heroes || heroes.length === 0) {
    return {
      minWr: 0.40,
      maxWr: 0.60,
      minPr: 0.00,
      maxPr: 0.10,
      minBr: 0.00,
      maxBr: 1.00,
    };
  }

  let minWr = Infinity;
  let maxWr = -Infinity;
  let minPr = Infinity;
  let maxPr = -Infinity;
  let minBr = Infinity;
  let maxBr = -Infinity;

  for (const h of heroes) {
    if (h.winRate < minWr) minWr = h.winRate;
    if (h.winRate > maxWr) maxWr = h.winRate;
    if (h.pickRate < minPr) minPr = h.pickRate;
    if (h.pickRate > maxPr) maxPr = h.pickRate;
    if (h.banRate < minBr) minBr = h.banRate;
    if (h.banRate > maxBr) maxBr = h.banRate;
  }

  return { minWr, maxWr, minPr, maxPr, minBr, maxBr };
}

/**
 * Computes the relative fill percentage (clamped between 5% and 100%)
 * for visual representation on a benchmark bar.
 */
export function calculateBenchmarkFill(value: number, min: number, max: number): number {
  if (max <= min) return 100;
  return Math.min(100, Math.max(5, ((value - min) / (max - min)) * 100));
}
