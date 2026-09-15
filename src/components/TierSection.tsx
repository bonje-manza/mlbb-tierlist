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
    badgeBg: 'bg-tier-s text-slate-950 shadow-lg shadow-tier-s/30',
    borderAccent: 'border-tier-s/40',
    glowClass: 'from-tier-s/10',
  },
  'A': {
    label: 'A',
    descriptor: 'Strong & Reliable',
    badgeBg: 'bg-tier-a text-white shadow-lg shadow-tier-a/30',
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
    badgeBg: 'bg-tier-c text-white',
    borderAccent: 'border-tier-c/40',
    glowClass: 'from-tier-c/10',
  },
  'D': {
    label: 'D',
    descriptor: 'Weak / Avoid in Ranked',
    badgeBg: 'bg-tier-d text-slate-300',
    borderAccent: 'border-tier-d/40',
    glowClass: 'from-tier-d/10',
  },
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
      className={`relative mb-4 rounded-xl border ${meta.borderAccent} bg-gradient-to-b ${meta.glowClass} to-cyber-card/60 p-2.5 sm:p-3.5 backdrop-blur-sm`}
    >
      {/* Tier Header Bar */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
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
