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
/** Per-tier chip colors mirroring the calibrated tier accents. */
const TIER_CHIP: Record<Tier, string> = {
  'S+': 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
  'S': 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
  'A': 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
  'B': 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  'C': 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  'D': 'bg-zinc-800 text-zinc-400 border border-zinc-700/60',
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
      className="group relative flex flex-col items-center w-full min-h-[48px] min-w-[44px] p-1 sm:p-1.5 rounded-lg bg-cyber-card hover:bg-cyber-hover border border-cyber-border hover:border-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-400 focus:outline-none active:scale-[0.97] transition-all duration-150 select-none overflow-hidden cursor-pointer shadow-xs"
    >
      {/* Avatar Container with fixed 1:1 aspect ratio */}
      <div className="relative w-full aspect-square rounded-md overflow-hidden bg-black border border-cyber-border/70">
        {/* Shimmering loading skeleton while image loads on slow network */}
        {!imgLoaded && !imgError && (
          <div
            data-testid="hero-avatar-skeleton"
            className="absolute inset-0 bg-zinc-800 animate-pulse"
          />
        )}

        {!imgError ? (
          <img
            src={hero.avatarUrl}
            alt={hero.name}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            className={`w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-200 ease-out ${
              imgLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ) : (
          <div
            data-testid="hero-avatar-fallback"
            className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-400"
          >
            <svg
              className="w-5 h-5 text-zinc-500 mb-0.5"
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
            <span className="text-[10px] font-mono uppercase font-medium tabular-nums text-zinc-400">
              {hero.name.slice(0, 3)}
            </span>
          </div>
        )}

        {/* Tier chip (Top Left) - shown when tier grouping is hidden, e.g. Ban Priority */}
        {showTierChip && (
          <div className="absolute top-1 left-1 bg-black/85 backdrop-blur-xs px-1 py-0.5 rounded border border-zinc-800 leading-none shadow-xs">
            <span
              className={`text-[10px] font-mono font-medium tabular-nums px-0.5 rounded-xs ${TIER_CHIP[hero.tier] || TIER_CHIP['D']}`}
            >
              {hero.tier}
            </span>
          </div>
        )}

        {/* Power Score Badge (Top Right) */}
        <div
          className="absolute top-1 right-1 bg-black/85 backdrop-blur-xs px-1.5 py-0.5 rounded border border-zinc-800 leading-none shadow-xs"
          title="Power Score: composite of win rate (50%), pick rate (25%) and ban rate (25%)"
        >
          <span
            data-testid="hero-power-score"
            className="text-[10px] font-mono font-medium tabular-nums text-zinc-300"
          >
            {powerScoreFormatted}
          </span>
        </div>

        {/* Win/Ban Rate Overlay Gradient Pill */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/80 to-transparent pt-3 pb-0.5 px-1 flex items-center justify-center">
          <span
            data-testid={metric === 'banRate' ? 'hero-ban-rate' : 'hero-win-rate'}
            className={`text-[11px] font-mono font-medium tracking-tight tabular-nums ${
              metric === 'banRate' ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {overlayMetric}
          </span>
        </div>
      </div>

      {/* Hero Name Label */}
      <span className="w-full text-center text-xs font-medium text-zinc-300 group-hover:text-zinc-100 truncate mt-1 leading-tight tracking-tight px-0.5">
        {hero.name}
      </span>
    </button>
  );
};
