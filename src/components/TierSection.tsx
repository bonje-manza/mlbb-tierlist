import React from 'react';
import type { Tier, NormalizedHero } from '../types/index.ts';
import { HeroTile } from './HeroTile.tsx';

export interface TierSectionProps {
  tier: Tier;
  heroes: NormalizedHero[];
  onSelectHero?: (hero: NormalizedHero) => void;
}

interface TierMeta {
  label: string;
  descriptor: string;
  badgeBg: string;
  textAccent: string;
  borderAccent: string;
}

const TIER_METADATA: Record<Tier, TierMeta> = {
  'S+': {
    label: 'S+',
    descriptor: 'Must Pick or Ban',
    badgeBg: 'bg-rose-950/30 border border-rose-500/30 text-rose-300',
    textAccent: 'text-rose-400',
    borderAccent: 'border-rose-500/20',
  },
  'S': {
    label: 'S',
    descriptor: 'Top Meta / High Priority',
    badgeBg: 'bg-indigo-950/30 border border-indigo-500/30 text-indigo-300',
    textAccent: 'text-indigo-400',
    borderAccent: 'border-indigo-500/20',
  },
  'A': {
    label: 'A',
    descriptor: 'Strong & Reliable',
    badgeBg: 'bg-cyan-950/30 border border-cyan-500/30 text-cyan-300',
    textAccent: 'text-cyan-400',
    borderAccent: 'border-cyan-500/20',
  },
  'B': {
    label: 'B',
    descriptor: 'Balanced / Situational',
    badgeBg: 'bg-emerald-950/30 border border-emerald-500/30 text-emerald-300',
    textAccent: 'text-emerald-400',
    borderAccent: 'border-emerald-500/20',
  },
  'C': {
    label: 'C',
    descriptor: 'Underperforming',
    badgeBg: 'bg-amber-950/30 border border-amber-500/30 text-amber-300',
    textAccent: 'text-amber-400',
    borderAccent: 'border-amber-500/20',
  },
  'D': {
    label: 'D',
    descriptor: 'Weak / Avoid in Ranked',
    badgeBg: 'bg-zinc-900/50 border border-zinc-800 text-zinc-400',
    textAccent: 'text-zinc-400',
    borderAccent: 'border-zinc-800',
  },
};

export interface EmptyTierRowProps {
  tier: Tier;
  expanded: boolean;
  onToggle: () => void;
}

/**
 * Collapsed placeholder for tiers with zero visible heroes.
 * Keeps the tier header findable without spending a full card of
 * vertical space during the draft scan.
 */
export const EmptyTierRow: React.FC<EmptyTierRowProps> = ({
  tier,
  expanded,
  onToggle,
}) => {
  const meta = TIER_METADATA[tier] || TIER_METADATA['D'];

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      aria-label={`${tier} tier, ${meta.descriptor}, 0 heroes. Activate to ${expanded ? 'collapse' : 'expand'}.`}
      data-testid={`empty-tier-row-${tier}`}
      className="w-full min-h-[44px] flex items-center justify-between gap-3 px-3.5 py-2 rounded-lg border border-cyber-border bg-cyber-card/60 hover:bg-cyber-card hover:border-zinc-700 text-left transition-all duration-150 cursor-pointer active:scale-[0.99]"
    >
      <span className="flex items-center gap-2.5 min-w-0">
        <span
          className={`px-2 py-0.5 rounded text-xs font-mono font-medium shrink-0 ${meta.badgeBg} ${meta.textAccent}`}
        >
          {tier}
        </span>
        <span className="text-xs sm:text-sm font-medium text-zinc-300 truncate">
          {meta.descriptor}
        </span>
      </span>
      <span className="flex items-center gap-2 shrink-0">
        <span className="text-xs font-mono font-medium tabular-nums text-zinc-500">
          0 Heroes
        </span>
        <svg
          className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </span>
    </button>
  );
};

export const TierSection: React.FC<TierSectionProps> = ({
  tier,
  heroes,
  onSelectHero,
}) => {
  const meta = TIER_METADATA[tier] || TIER_METADATA['D'];

  return (
    <section
      aria-labelledby={`tier-heading-${tier.replace('+', '-plus')}`}
      className="relative rounded-xl border border-cyber-border bg-cyber-card/40 p-2 sm:p-3.5 shadow-xs"
    >
      <div className="flex flex-col md:flex-row items-stretch gap-2.5 sm:gap-3.5">
        {/* Tier Shelf Header Badge */}
        <div
          className={`flex md:flex-col items-center justify-between md:justify-center gap-1.5 sm:gap-2 px-3.5 py-2.5 sm:py-3.5 rounded-lg ${meta.badgeBg} md:w-28 lg:w-32 shrink-0 select-none shadow-xs`}
        >
          <div className="flex items-center md:flex-col gap-2.5 md:gap-1">
            <span
              id={`tier-heading-${tier.replace('+', '-plus')}`}
              className={`text-xl sm:text-2xl md:text-3xl font-mono font-semibold leading-none ${meta.textAccent}`}
            >
              {tier}
            </span>
            <span className="text-xs sm:text-[11px] font-medium tracking-tight text-zinc-300 md:text-center leading-tight">
              {meta.descriptor}
            </span>
          </div>
          <span className="text-[10px] sm:text-xs font-mono font-medium tabular-nums text-zinc-400 bg-black/60 px-2 py-0.5 rounded border border-zinc-800/80 shrink-0">
            {heroes.length} {heroes.length === 1 ? 'Hero' : 'Heroes'}
          </span>
        </div>

        {/* Hero Tiles Grid Shelf */}
        <div className="flex-1 min-w-0">
          {heroes.length > 0 ? (
            <div
              data-testid={`tier-grid-${tier}`}
              className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-1.5 sm:gap-2"
            >
              {heroes.map((hero) => (
                <HeroTile key={hero.id} hero={hero} onSelect={onSelectHero} />
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs sm:text-sm text-zinc-500 font-normal">
              No heroes in this tier
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
