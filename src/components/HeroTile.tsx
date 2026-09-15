import React, { useState } from 'react';
import type { NormalizedHero } from '../types/index.ts';

export interface HeroTileProps {
  hero: NormalizedHero;
  onSelect?: (hero: NormalizedHero) => void;
}

export const HeroTile: React.FC<HeroTileProps> = ({ hero, onSelect }) => {
  const [imgError, setImgError] = useState(false);
  const winRateFormatted = (hero.winRate * 100).toFixed(1) + '%';

  return (
    <button
      type="button"
      onClick={() => onSelect?.(hero)}
      aria-label={`${hero.name}, ${hero.tier} Tier, Win Rate ${winRateFormatted}`}
      className="group relative flex flex-col items-center w-full min-h-[48px] min-w-[44px] p-1 rounded-lg bg-cyber-card/90 border border-cyber-border hover:border-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 active:scale-95 transition-all duration-150 select-none overflow-hidden"
    >
      {/* Avatar Container with fixed 1:1 aspect ratio to avoid layout shift */}
      <div className="relative w-full aspect-square rounded-md overflow-hidden bg-slate-900 border border-slate-800/80">
        {!imgError ? (
          <img
            src={hero.avatarUrl}
            alt={hero.name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-200"
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
            <span className="text-[9px] font-mono uppercase font-bold text-slate-400">
              {hero.name.slice(0, 3)}
            </span>
          </div>
        )}

        {/* Win Rate Overlay Pill */}
        <div className="absolute bottom-0 inset-x-0 bg-cyber-ground/85 backdrop-blur-[2px] py-0.5 px-1 border-t border-slate-700/50 flex items-center justify-center">
          <span className="text-[9px] sm:text-[10px] font-mono font-bold tracking-tight text-emerald-400">
            {winRateFormatted}
          </span>
        </div>
      </div>

      {/* Hero Name Label (Sub-11px bold, truncated) */}
      <span className="w-full text-center text-[10px] sm:text-[11px] font-bold text-slate-200 group-hover:text-white truncate mt-1 leading-tight tracking-tight">
        {hero.name}
      </span>
    </button>
  );
};
