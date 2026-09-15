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
  borderAccent: string;
  glowClass: string;
}

const TIER_METADATA: Record<Tier, TierMeta> = {
  'S+': {
    label: 'S+',
    descriptor: 'Must Pick or Ban',
    badgeBg: 'bg-tier-s-plus text-white shadow-lg shadow-tier-s-plus/30',
    borderAccent: 'border-tier-s-plus/40',
    glowClass: 'from-tier-s-plus/10',
  },
  'S': {
    label: 'S',
    descriptor: 'Top Meta / High Priority',
    badgeBg: 'bg-tier-s text-white shadow-lg shadow-tier-s/30',
    borderAccent: 'border-tier-s/40',
    glowClass: 'from-tier-s/10',
  },
  'A': {
    label: 'A',
    descriptor: 'Strong & Reliable',
    badgeBg: 'bg-tier-a text-slate-950 shadow-lg shadow-tier-a/30',
    borderAccent: 'border-tier-a/40',
    glowClass: 'from-tier-a/10',
  },
  'B': {
    label: 'B',
    descriptor: 'Balanced / Situational',
    badgeBg: 'bg-tier-b text-slate-950 shadow-lg shadow-tier-b/30',
    borderAccent: 'border-tier-b/40',
    glowClass: 'from-tier-b/10',
  },
  'C': {
    label: 'C',
    descriptor: 'Underperforming',
    badgeBg: 'bg-tier-c text-slate-950',
    borderAccent: 'border-tier-c/40',
    glowClass: 'from-tier-c/10',
  },
  'D': {
    label: 'D',
    descriptor: 'Weak / Avoid in Ranked',
    badgeBg: 'bg-tier-d text-slate-100',
    borderAccent: 'border-tier-d/40',
    glowClass: 'from-tier-d/10',
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
      className="w-full min-h-[44px] flex items-center justify-between gap-2 px-2.5 py-2 mb-2 rounded-xl border border-slate-800/70 bg-cyber-card/40 text-left transition-colors hover:border-slate-700 active:scale-[0.99]"
    >
      <span className="flex items-center gap-2 min-w-0">
        <span
          className={`px-2 py-0.5 rounded text-[11px] font-black tracking-wider uppercase shrink-0 ${meta.badgeBg}`}
        >
          {tier}
        </span>
        <span className="text-xs font-medium text-slate-500 truncate">
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
      className={`relative mb-3 rounded-xl border ${meta.borderAccent} bg-gradient-to-b ${meta.glowClass} to-cyber-card/60 p-2 sm:p-3 backdrop-blur-sm`}
    >
      {/* Tier Header Bar */}
      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          {/* Neon Tier Badge */}
          <span
            id={`tier-heading-${tier.replace('+', '-plus')}`}
            className={`px-2 py-0.5 rounded text-xs font-black tracking-wider uppercase ${meta.badgeBg}`}
          >
            {tier}
          </span>
          <span className="text-xs sm:text-sm font-semibold text-slate-300">
            {meta.descriptor}
          </span>
        </div>

        {/* Hero Count Badge */}
        <span className="text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded-full border border-slate-800">
          {heroes.length} {heroes.length === 1 ? 'Hero' : 'Heroes'}
        </span>
      </div>

      {/* Hero Tiles Grid */}
      {heroes.length > 0 ? (
        <div
          data-testid={`tier-grid-${tier}`}
          className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5"
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
    </section>
  );
};
