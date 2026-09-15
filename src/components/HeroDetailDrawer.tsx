import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { NormalizedHero, Tier } from '../types/index.ts';

export interface HeroDetailDrawerProps {
  hero: NormalizedHero | null;
  heroPool?: NormalizedHero[];
  onClose: () => void;
  onSelectPartner?: (heroId: number) => void;
}

interface TierVisualMeta {
  badgeClass: string;
  avatarBorder: string;
  avatarRing: string;
}

const TIER_VISUALS: Record<Tier, TierVisualMeta> = {
  'S+': {
    badgeClass: 'bg-tier-s-plus text-white shadow-lg shadow-tier-s-plus/30',
    avatarBorder: 'border-tier-s-plus',
    avatarRing: 'ring-2 ring-tier-s-plus/40',
  },
  'S': {
    badgeClass: 'bg-tier-s text-slate-950 shadow-lg shadow-tier-s/30',
    avatarBorder: 'border-tier-s',
    avatarRing: 'ring-2 ring-tier-s/40',
  },
  'A': {
    badgeClass: 'bg-tier-a text-white shadow-lg shadow-tier-a/30',
    avatarBorder: 'border-tier-a',
    avatarRing: 'ring-2 ring-tier-a/40',
  },
  'B': {
    badgeClass: 'bg-tier-b text-slate-950 shadow-lg shadow-tier-b/30',
    avatarBorder: 'border-tier-b',
    avatarRing: 'ring-2 ring-tier-b/40',
  },
  'C': {
    badgeClass: 'bg-tier-c text-white',
    avatarBorder: 'border-tier-c',
    avatarRing: 'ring-2 ring-tier-c/40',
  },
  'D': {
    badgeClass: 'bg-tier-d text-slate-300',
    avatarBorder: 'border-tier-d',
    avatarRing: 'ring-2 ring-tier-d/40',
  },
};

export const HeroDetailDrawer: React.FC<HeroDetailDrawerProps> = ({
  hero,
  heroPool,
  onClose,
  onSelectPartner,
}) => {
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [partnerErrors, setPartnerErrors] = useState<Record<number, boolean>>({});
  const touchStartYRef = useRef<number | null>(null);

  // Reset avatar state when selected hero changes
  useEffect(() => {
    setAvatarLoaded(false);
    setAvatarError(false);
  }, [hero?.id]);

  // Lock background body scroll while active & handle Escape key
  useEffect(() => {
    if (!hero) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [hero, onClose]);

  // Pool min/max calculation for benchmark progress bars
  const bounds = useMemo(() => {
    if (!heroPool || heroPool.length === 0) {
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

    for (const h of heroPool) {
      if (h.winRate < minWr) minWr = h.winRate;
      if (h.winRate > maxWr) maxWr = h.winRate;
      if (h.pickRate < minPr) minPr = h.pickRate;
      if (h.pickRate > maxPr) maxPr = h.pickRate;
      if (h.banRate < minBr) minBr = h.banRate;
      if (h.banRate > maxBr) maxBr = h.banRate;
    }

    return { minWr, maxWr, minPr, maxPr, minBr, maxBr };
  }, [heroPool]);

  if (!hero) return null;

  const visuals = TIER_VISUALS[hero.tier] || TIER_VISUALS['D'];

  const wrPercent = (hero.winRate * 100).toFixed(2);
  const prPercent = (hero.pickRate * 100).toFixed(2);
  const brPercent = (hero.banRate * 100).toFixed(2);

  // Progress bar fill percentages relative to hero pool
  const wrFill = bounds.maxWr > bounds.minWr
    ? Math.min(100, Math.max(5, ((hero.winRate - bounds.minWr) / (bounds.maxWr - bounds.minWr)) * 100))
    : 100;

  const prFill = bounds.maxPr > bounds.minPr
    ? Math.min(100, Math.max(5, ((hero.pickRate - bounds.minPr) / (bounds.maxPr - bounds.minPr)) * 100))
    : 100;

  const brFill = bounds.maxBr > bounds.minBr
    ? Math.min(100, Math.max(5, ((hero.banRate - bounds.minBr) / (bounds.maxBr - bounds.minBr)) * 100))
    : 100;

  // Swipe/drag handle touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      touchStartYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartYRef.current !== null && e.touches.length > 0) {
      const deltaY = e.touches[0].clientY - touchStartYRef.current;
      if (deltaY > 60) {
        touchStartYRef.current = null;
        onClose();
      }
    }
  };

  const handleTouchEnd = () => {
    touchStartYRef.current = null;
  };

  return (
    <div
      role="presentation"
      data-testid="drawer-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-end animate-fade-in"
    >
      {/* Drawer Content Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-hero-name"
        data-testid="drawer-panel"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl bg-cyber-card border-t border-cyber-border shadow-2xl flex flex-col p-4 sm:p-5 text-slate-100 animate-slide-up"
      >
        {/* Top Drag Handle & Close Row */}
        <div className="relative w-full flex items-center justify-center pb-2">
          {/* Visual Drag Handle with touch detection */}
          <div
            data-testid="drawer-drag-handle"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="w-16 h-4 flex items-center justify-center cursor-grab active:cursor-grabbing py-1"
          >
            <div className="w-12 h-1.5 bg-slate-600 rounded-full hover:bg-slate-500 transition-colors" />
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close hero details"
            className="absolute right-0 top-0 min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/60 transition-colors flex items-center justify-center active:scale-95"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Hero Profile Header */}
        <div className="flex items-start gap-3.5 sm:gap-4 pb-4 border-b border-slate-800/80">
          {/* Avatar Container */}
          <div
            className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-900 border-2 ${visuals.avatarBorder} ${visuals.avatarRing} shrink-0 shadow-lg`}
          >
            {!avatarLoaded && !avatarError && (
              <div className="absolute inset-0 bg-slate-800 animate-pulse" />
            )}

            {!avatarError ? (
              <img
                src={hero.avatarUrl}
                alt={hero.name}
                loading="lazy"
                onLoad={() => setAvatarLoaded(true)}
                onError={() => setAvatarError(true)}
                className={`w-full h-full object-cover transition-opacity duration-200 ${
                  avatarLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
            ) : (
              <div
                data-testid="drawer-avatar-fallback"
                className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-400"
              >
                <svg
                  className="w-7 h-7 text-slate-500 mb-0.5"
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
                <span className="text-[10px] font-mono uppercase font-bold text-slate-400">
                  {hero.name.slice(0, 3)}
                </span>
              </div>
            )}
          </div>

          {/* Hero Header Details */}
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h2
                id="drawer-hero-name"
                className="text-lg sm:text-xl font-black text-white tracking-tight truncate"
              >
                {hero.name}
              </h2>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider ${visuals.badgeClass}`}
              >
                {hero.tier} TIER
              </span>
            </div>

            {/* Roles & Lanes Subtitle */}
            <p className="text-xs text-slate-400 mb-1.5 flex items-center gap-1.5 flex-wrap">
              <span>{hero.roles.length > 0 ? hero.roles.join(' / ') : 'General'}</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300 font-medium">
                {hero.lanes.length > 0 ? hero.lanes.join(', ') : 'All Lanes'}
              </span>
            </p>

            {/* Power Score Badge */}
            <div className="inline-flex items-center">
              <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/40 border border-cyan-800/60 px-2 py-0.5 rounded">
                Power Score: {hero.powerScore.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Telemetry Benchmark Cards */}
        <div className="py-4 border-b border-slate-800/80">
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2.5">
            Telemetry Benchmarks
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Win Rate Card */}
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                  Win Rate
                </span>
                <span
                  data-testid="metric-winrate-value"
                  className="text-xs font-mono font-bold text-emerald-400"
                >
                  {wrPercent}%
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  data-testid="progress-bar-winrate"
                  role="progressbar"
                  aria-valuenow={Math.round(wrFill)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  style={{ width: `${wrFill}%` }}
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                />
              </div>
            </div>

            {/* Pick Rate Card */}
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                  Pick Rate
                </span>
                <span
                  data-testid="metric-pickrate-value"
                  className="text-xs font-mono font-bold text-cyan-400"
                >
                  {prPercent}%
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  data-testid="progress-bar-pickrate"
                  role="progressbar"
                  aria-valuenow={Math.round(prFill)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  style={{ width: `${prFill}%` }}
                  className="h-full bg-cyan-500 rounded-full transition-all duration-300"
                />
              </div>
            </div>

            {/* Ban Rate Card */}
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                  Ban Rate
                </span>
                <span
                  data-testid="metric-banrate-value"
                  className="text-xs font-mono font-bold text-rose-400"
                >
                  {brPercent}%
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  data-testid="progress-bar-banrate"
                  role="progressbar"
                  aria-valuenow={Math.round(brFill)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  style={{ width: `${brFill}%` }}
                  className="h-full bg-rose-500 rounded-full transition-all duration-300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Top 3 Synergistic Teammates */}
        <div className="pt-4">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-200">
              Top Duo Synergies
            </h3>
            <span className="text-[10px] font-mono text-slate-400">
              Win Rate Boost
            </span>
          </div>

          {hero.synergies && hero.synergies.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {hero.synergies.slice(0, 3).map((partner) => {
                const partnerHasError = partnerErrors[partner.heroId];
                const deltaFormatted = (partner.winRateDelta * 100).toFixed(2);

                return (
                  <button
                    key={partner.heroId}
                    type="button"
                    onClick={() => onSelectPartner?.(partner.heroId)}
                    aria-label={`${partner.name}, synergy +${deltaFormatted}% Win Rate`}
                    className="min-h-[48px] min-w-[44px] flex items-center gap-2.5 p-2 rounded-xl bg-cyber-ground/80 hover:bg-slate-800 border border-cyber-border hover:border-slate-600 transition-all text-left group active:scale-95"
                  >
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-900 border border-slate-700/80 shrink-0">
                      {!partnerHasError ? (
                        <img
                          src={partner.avatarUrl}
                          alt={partner.name}
                          loading="lazy"
                          onError={() =>
                            setPartnerErrors((prev) => ({ ...prev, [partner.heroId]: true }))
                          }
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-800 text-[10px] font-mono font-bold text-slate-400 uppercase">
                          {partner.name.slice(0, 3)}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
                        {partner.name}
                      </span>
                      <span className="inline-flex items-center text-[10px] font-mono font-bold text-emerald-400">
                        +{deltaFormatted}% WR
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div
              data-testid="synergy-empty-state"
              className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 text-center text-xs text-slate-400"
            >
              No positive duo synergies recorded for this hero.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
