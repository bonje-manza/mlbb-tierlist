import React, { useState } from 'react';
import type { NormalizedHero, Tier } from '../types/index.ts';

export interface HeroTileProps {
  hero: NormalizedHero;
  onSelect?: (hero: NormalizedHero) => void;
  /** Overlay metric: win rate (default) or ban rate for Ban Priority mode. */
  metric?: 'winRate' | 'banRate';
  /** Show a compact tier chip on the avatar (used when tier grouping is hidden). */
  showTierChip?: boolean;
}

/** Per-tier chip colors mirroring the badge pairings (Two Reds Rule: never pink-adjacent here). */
const TIER_CHIP: Record<Tier, string> = {
  'S+': 'bg-tier-s-plus text-white',
  'S': 'bg-tier-s text-white',
  'A': 'bg-tier-a text-slate-950',
  'B': 'bg-tier-b text-slate-950',
  'C': 'bg-tier-c text-slate-950',
  'D': 'bg-tier-d text-slate-100',
};

export const HeroTile: React.FC<HeroTileProps> = ({
  hero,
  onSelect,
  metric = 'winRate',
  showTierChip = false,
}) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const winRateFormatted = (hero.winRate * 100).toFixed(1) + '%';
  const banRateFormatted = (hero.banRate * 100).toFixed(1) + '%';
  const powerScoreFormatted = hero.powerScore.toFixed(1);
  const overlayMetric = metric === 'banRate' ? banRateFormatted : winRateFormatted;
  const overlayLabel = metric === 'banRate' ? 'Ban Rate' : 'Win Rate';

  return (
    <button
      type="button"
      onClick={() => onSelect?.(hero)}
      aria-label={`${hero.name}, ${hero.tier} Tier, ${overlayLabel} ${overlayMetric}, Power Score ${powerScoreFormatted}`}
      className="group relative flex flex-col items-center w-full min-h-[48px] min-w-[44px] p-1 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/90 focus:border-slate-500 focus:outline-none active:scale-[0.98] transition-all duration-150 select-none overflow-hidden"
    >
      {/* Avatar Container with fixed 1:1 aspect ratio to avoid layout shift */}
      <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-slate-950 border border-slate-800/60">
        {/* Shimmering loading skeleton while image loads on slow network */}
        {!imgLoaded && !imgError && (
          <div
            data-testid="hero-avatar-skeleton"
            className="absolute inset-0 bg-slate-800 animate-pulse"
          />
        )}

        {!imgError ? (
          <img
            src={hero.avatarUrl}
            alt={hero.name}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            className={`w-full h-full object-cover transform group-hover:scale-105 transition-all duration-200 ${
              imgLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ) : (
          <div
            data-testid="hero-avatar-fallback"
            className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-400"
          >
            <svg
              className="w-5 h-5 text-slate-500 mb-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="text-[10px] font-mono uppercase font-bold tabular-nums text-slate-400">
              {hero.name.slice(0, 3)}
            </span>
          </div>
        )}

        {/* Tier chip (Top Left) — shown when tier grouping is hidden, e.g. Ban Priority */}
        {showTierChip && (
          <div className="absolute top-0.5 left-0.5 bg-slate-950/80 px-1 py-0.5 rounded border border-slate-800 leading-none">
            <span
              className={`text-[10px] font-bold tabular-nums px-0.5 rounded-sm ${TIER_CHIP[hero.tier] || TIER_CHIP['D']}`}
            >
              {hero.tier}
            </span>
          </div>
        )}

        {/* Power Score Badge (Top Right) - ADR 0003 */}
        <div
          className="absolute top-0.5 right-0.5 bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-800/80 leading-none"
          title="Power Score: composite of win rate (50%), pick rate (25%) and ban rate (25%)"
        >
          <span
            data-testid="hero-power-score"
            className="text-[10px] sm:text-[10px] font-mono font-medium tabular-nums text-slate-300"
          >
            {powerScoreFormatted}
          </span>
        </div>

        {/* Win/Ban Rate Overlay Pill */}
        <div className="absolute bottom-0 inset-x-0 bg-slate-950/90 py-0.5 px-1 border-t border-slate-800/80 flex items-center justify-center">
          <span
            data-testid={metric === 'banRate' ? 'hero-ban-rate' : 'hero-win-rate'}
            className={`text-[11px] sm:text-[11px] font-mono font-semibold tracking-tight tabular-nums ${metric === 'banRate' ? 'text-rose-400/90' : 'text-emerald-400/90'}`}
          >
            {overlayMetric}
          </span>
        </div>
      </div>

      {/* Hero Name Label (11px, truncated) */}
      <span className="w-full text-center text-[11px] sm:text-[11px] font-medium text-slate-300 group-hover:text-slate-100 truncate mt-1 leading-tight tracking-tight">
        {hero.name}
      </span>
    </button>
  );
};
