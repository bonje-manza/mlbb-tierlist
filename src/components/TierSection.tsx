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
    badgeBg: 'bg-red-950/40 border border-red-500/30 text-rose-200',
    textAccent: 'text-rose-400',
    borderAccent: 'border-red-950/60',
  },
  'S': {
    label: 'S',
    descriptor: 'Top Meta / High Priority',
    badgeBg: 'bg-purple-950/40 border border-purple-500/30 text-purple-200',
    textAccent: 'text-purple-400',
    borderAccent: 'border-purple-950/60',
  },
  'A': {
    label: 'A',
    descriptor: 'Strong & Reliable',
    badgeBg: 'bg-cyan-950/40 border border-cyan-500/30 text-cyan-200',
    textAccent: 'text-cyan-400',
    borderAccent: 'border-cyan-950/60',
  },
  'B': {
    label: 'B',
    descriptor: 'Balanced / Situational',
    badgeBg: 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-200',
    textAccent: 'text-emerald-400',
    borderAccent: 'border-emerald-950/60',
  },
  'C': {
    label: 'C',
    descriptor: 'Underperforming',
    badgeBg: 'bg-amber-950/40 border border-amber-500/30 text-amber-200',
    textAccent: 'text-amber-400',
    borderAccent: 'border-amber-950/60',
  },
  'D': {
    label: 'D',
    descriptor: 'Weak / Avoid in Ranked',
    badgeBg: 'bg-slate-900/60 border border-slate-700/40 text-slate-300',
    textAccent: 'text-slate-400',
    borderAccent: 'border-slate-800/60',
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
      className="w-full min-h-[44px] flex items-center justify-between gap-2 px-3 py-2 mb-2 rounded-xl border border-slate-800/60 bg-slate-900/30 text-left transition-colors hover:border-slate-700/80 active:scale-[0.99]"
    >
      <span className="flex items-center gap-2.5 min-w-0">
        <span
          className={`px-2 py-0.5 rounded-md text-xs font-bold tracking-wider uppercase shrink-0 ${meta.badgeBg} ${meta.textAccent}`}
        >
          {tier}
        </span>
        <span className="text-xs font-normal text-slate-400 truncate">
          {meta.descriptor}
        </span>
      </span>
      <span className="flex items-center gap-1.5 shrink-0">
        <span className="text-[11px] font-mono tabular-nums text-slate-500">
          0 Heroes
        </span>
        <svg
          className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-150 ${expanded ? 'rotate-180' : ''}`}
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
      className="relative mb-3 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-2 sm:p-3"
    >
      <div className="flex flex-col sm:flex-row items-stretch gap-2.5 sm:gap-3">
        {/* Blitz.gg Vertical Tier Badge Shelf on left */}
        <div
          className={`flex sm:flex-col items-center justify-between sm:justify-center gap-1.5 sm:gap-2 px-3 py-2 sm:py-3 rounded-xl ${meta.badgeBg} sm:w-20 md:w-24 shrink-0 select-none`}
        >
          <div className="flex items-center sm:flex-col gap-2 sm:gap-0.5">
            <span
              id={`tier-heading-${tier.replace('+', '-plus')}`}
              className={`text-lg sm:text-3xl font-black tracking-wider uppercase leading-none ${meta.textAccent}`}
            >
              {tier}
            </span>
            <span className="text-[11px] sm:text-[10px] font-medium tracking-tight text-slate-400 text-left sm:text-center leading-tight">
              {meta.descriptor}
            </span>
          </div>
          <span className="text-[10px] sm:text-[11px] font-mono font-medium tabular-nums text-slate-400 bg-slate-950/60 px-2 py-0.5 rounded-full border border-slate-800 shrink-0">
            {heroes.length} {heroes.length === 1 ? 'Hero' : 'Heroes'}
          </span>
        </div>

        {/* Hero Tiles Grid Shelf */}
        <div className="flex-1 min-w-0">
          {heroes.length > 0 ? (
            <div
              data-testid={`tier-grid-${tier}`}
              className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1.5 sm:gap-2"
            >
              {heroes.map((hero) => (
                <HeroTile key={hero.id} hero={hero} onSelect={onSelectHero} />
              ))}
            </div>
          ) : (
            <div className="py-4 text-center text-xs text-slate-500 italic">
              No heroes in this tier
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
