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
    badgeClass: 'bg-rose-950/40 border border-rose-500/40 text-rose-300 font-mono font-medium',
    avatarBorder: 'border-rose-500/50',
    avatarRing: 'ring-1 ring-rose-500/30',
  },
  'S': {
    badgeClass: 'bg-indigo-950/40 border border-indigo-500/40 text-indigo-300 font-mono font-medium',
    avatarBorder: 'border-indigo-500/50',
    avatarRing: 'ring-1 ring-indigo-500/30',
  },
  'A': {
    badgeClass: 'bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 font-mono font-medium',
    avatarBorder: 'border-cyan-500/50',
    avatarRing: 'ring-1 ring-cyan-500/30',
  },
  'B': {
    badgeClass: 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-mono font-medium',
    avatarBorder: 'border-emerald-500/50',
    avatarRing: 'ring-1 ring-emerald-500/30',
  },
  'C': {
    badgeClass: 'bg-amber-950/40 border border-amber-500/40 text-amber-300 font-mono font-medium',
    avatarBorder: 'border-amber-500/50',
    avatarRing: 'ring-1 ring-amber-500/30',
  },
  'D': {
    badgeClass: 'bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono font-medium',
    avatarBorder: 'border-zinc-700',
    avatarRing: 'ring-1 ring-zinc-700/30',
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
  <div className="p-3 rounded-lg bg-cyber-hover/50 border border-cyber-border flex flex-col justify-between shadow-xs">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-medium text-zinc-400 font-sans">
        {label}
      </span>
      <span
        data-testid={`metric-${testIdPrefix}-value`}
        className={`text-sm font-mono font-medium tabular-nums ${textColor}`}
      >
        {valueFormatted}
      </span>
    </div>
    <div className="w-full bg-black h-1.5 rounded-full overflow-hidden border border-zinc-800/70">
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
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  // Reset avatar state when selected hero changes
  useEffect(() => {
    setAvatarLoaded(false);
    setAvatarError(false);
  }, [hero?.id]);

  // Lock background body scroll while active, handle Escape key,
  // trap focus inside the dialog, and return focus on close.
  useEffect(() => {
    if (!hero) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus?.();
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
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center items-end md:items-center p-0 md:p-6 animate-fade-in"
    >
      {/* Drawer / Modal Content Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-hero-name"
        data-testid="drawer-panel"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-2xl md:rounded-xl bg-cyber-card border-t md:border border-cyber-border shadow-2xl flex flex-col p-4 sm:p-6 text-zinc-100 animate-slide-up md:animate-scale-in"
      >
        {/* Top Header Row with mobile drag handle and close button */}
        <div className="relative w-full flex items-center justify-between pb-2">
          {/* Visual Drag Handle for mobile touch screens */}
          <div
            data-testid="drawer-drag-handle"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="w-full h-11 min-h-[44px] md:hidden flex items-center justify-center cursor-grab active:cursor-grabbing"
          >
            <div className="w-12 h-1.5 bg-zinc-700 rounded-full hover:bg-zinc-600 transition-colors" />
          </div>

          {/* Close Button */}
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close hero details"
            className="ml-auto min-h-[44px] min-w-[44px] p-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-zinc-700 transition-colors flex items-center justify-center active:scale-95 cursor-pointer"
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
        <div className="flex items-start gap-4 pb-4 border-b border-cyber-border">
          {/* Avatar Container */}
          <div
            className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-black border-2 ${visuals.avatarBorder} ${visuals.avatarRing} shrink-0 shadow-sm`}
          >
            {!avatarLoaded && !avatarError && (
              <div className="absolute inset-0 bg-zinc-800 animate-pulse" />
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
                className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-400"
              >
                <svg
                  className="w-7 h-7 text-zinc-500 mb-0.5"
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
                <span className="text-[10px] font-mono uppercase font-medium text-zinc-400">
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
                className="text-lg sm:text-xl font-semibold text-white tracking-tight truncate"
              >
                {hero.name}
              </h2>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider ${visuals.badgeClass}`}
              >
                {hero.tier} TIER
              </span>
            </div>

            {/* Roles & Lanes Subtitle */}
            <p className="text-xs text-zinc-400 mb-1.5 flex items-center gap-1.5 flex-wrap">
              {hero.roles.length > 0 && <span>{hero.roles.join(' / ')}</span>}
              {hero.roles.length > 0 && hero.lanes.length > 0 && (
                <span className="text-zinc-600">·</span>
              )}
              {hero.lanes.length > 0 && (
                <span className="text-zinc-300 font-medium">{hero.lanes.join(', ')}</span>
              )}
            </p>

            {/* Power Score Badge */}
            <div className="inline-flex flex-col items-start mt-1">
              <span
                title="Power Score: composite of win rate (50%), pick rate (25%) and ban rate (25%)"
                className="text-xs font-mono font-medium tabular-nums text-zinc-200 bg-cyber-hover border border-zinc-700/60 px-2.5 py-1 rounded-md shadow-xs"
              >
                Power Score: {hero.powerScore.toFixed(1)}
              </span>
              <span className="text-[10px] font-mono tabular-nums text-zinc-500 mt-1">
                Weights: 50% WR · 25% PR · 25% BR
              </span>
            </div>
          </div>
        </div>

        {/* Telemetry Benchmark Cards */}
        <div className="py-4 border-b border-cyber-border">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs sm:text-sm font-medium text-zinc-200">
              Telemetry Benchmarks
            </div>
            <span className="text-xs font-mono text-zinc-500">
              Pool relative
            </span>
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
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs sm:text-sm font-medium text-zinc-200">
              Top Duo Synergies
            </h3>
            <span className="text-xs font-mono text-emerald-400 font-medium">
              Win Rate Boost
            </span>
          </div>

          {hero.synergies && hero.synergies.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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
                    className="min-h-[48px] min-w-[44px] flex items-center gap-3 p-2.5 rounded-lg bg-cyber-hover/50 hover:bg-cyber-hover border border-cyber-border hover:border-zinc-700 transition-all text-left group active:scale-95 cursor-pointer shadow-xs"
                  >
                    <div className="relative w-11 h-11 rounded-md overflow-hidden bg-black border border-zinc-800 shrink-0">
                      {!partnerHasError ? (
                        <img
                          src={partner.avatarUrl}
                          alt={partner.name}
                          loading="lazy"
                          onError={() =>
                            setPartnerErrors((prev) => ({ ...prev, [partner.heroId]: true }))
                          }
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-[10px] font-mono font-medium text-zinc-400 uppercase">
                          {partner.name.slice(0, 3)}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs sm:text-sm font-medium text-zinc-200 group-hover:text-white truncate">
                        {partner.name}
                      </span>
                      <span className="inline-flex items-center text-xs font-mono font-medium text-emerald-400">
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
              className="p-6 rounded-lg bg-cyber-hover/20 border border-cyber-border text-center text-xs sm:text-sm text-zinc-400"
            >
              No positive duo synergies recorded for this hero.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
