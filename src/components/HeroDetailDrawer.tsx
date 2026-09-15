import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { NormalizedHero, Tier } from '../types/index.ts';
import { calculateTelemetryBounds, calculateBenchmarkFill } from '../utils/telemetry.ts';

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

interface BenchmarkCardProps {
  label: string;
  valueFormatted: string;
  metricValue: number;
  fillPercent: number;
  barColor: string;
  textColor: string;
  testIdPrefix: string;
}

const BenchmarkCard: React.FC<BenchmarkCardProps> = ({
  label,
  valueFormatted,
  metricValue,
  fillPercent,
  barColor,
  textColor,
  testIdPrefix,
}) => (
  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between">
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
        {label}
      </span>
      <span
        data-testid={`metric-${testIdPrefix}-value`}
        className={`text-xs font-mono font-bold ${textColor}`}
      >
        {valueFormatted}
      </span>
    </div>
    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
      <div
        data-testid={`progress-bar-${testIdPrefix}`}
        role="progressbar"
        aria-valuenow={Math.round(metricValue)}
        aria-valuetext={valueFormatted}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{ width: `${fillPercent}%` }}
        className={`h-full ${barColor} rounded-full transition-all duration-300`}
      />
    </div>
  </div>
);

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
  const bounds = useMemo(() => calculateTelemetryBounds(heroPool), [heroPool]);

  if (!hero) return null;

  const visuals = TIER_VISUALS[hero.tier] || TIER_VISUALS['D'];

  const wrPercent = (hero.winRate * 100).toFixed(2);
  const prPercent = (hero.pickRate * 100).toFixed(2);
  const brPercent = (hero.banRate * 100).toFixed(2);

  // Progress bar fill percentages relative to hero pool
  const wrFill = calculateBenchmarkFill(hero.winRate, bounds.minWr, bounds.maxWr);
  const prFill = calculateBenchmarkFill(hero.pickRate, bounds.minPr, bounds.maxPr);
  const brFill = calculateBenchmarkFill(hero.banRate, bounds.minBr, bounds.maxBr);

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
          {/* Visual Drag Handle with >= 44px touch detection target */}
          <div
            data-testid="drawer-drag-handle"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="w-full h-11 min-h-[44px] flex items-center justify-center cursor-grab active:cursor-grabbing"
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
              {hero.roles.length > 0 && <span>{hero.roles.join(' / ')}</span>}
              {hero.roles.length > 0 && hero.lanes.length > 0 && (
                <span className="text-slate-600">•</span>
              )}
              {hero.lanes.length > 0 && (
                <span className="text-slate-300 font-medium">{hero.lanes.join(', ')}</span>
              )}
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
            <BenchmarkCard
              label="Win Rate"
              valueFormatted={`${wrPercent}%`}
              metricValue={hero.winRate * 100}
              fillPercent={wrFill}
              barColor="bg-emerald-500"
              textColor="text-emerald-400"
              testIdPrefix="winrate"
            />
            <BenchmarkCard
              label="Pick Rate"
              valueFormatted={`${prPercent}%`}
              metricValue={hero.pickRate * 100}
              fillPercent={prFill}
              barColor="bg-cyan-500"
              textColor="text-cyan-400"
              testIdPrefix="pickrate"
            />
            <BenchmarkCard
              label="Ban Rate"
              valueFormatted={`${brPercent}%`}
              metricValue={hero.banRate * 100}
              fillPercent={brFill}
              barColor="bg-rose-500"
              textColor="text-rose-400"
              testIdPrefix="banrate"
            />
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
                const deltaSign = partner.winRateDelta > 0 ? '+' : '';

                return (
                  <button
                    key={partner.heroId}
                    type="button"
                    onClick={() => onSelectPartner?.(partner.heroId)}
                    aria-label={`${partner.name}, synergy ${deltaSign}${deltaFormatted}% Win Rate`}
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
                        {deltaSign}{deltaFormatted}% WR
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
