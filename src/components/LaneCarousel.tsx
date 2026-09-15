import React, { useRef } from 'react';
import type { LaneFilter } from '../types/index.ts';
import { LANE_FILTERS, LANE_FILTER_ACCESSIBLE_NAMES } from '../utils/laneFilter.ts';

export interface LaneCarouselProps {
  selectedLane: LaneFilter;
  onSelectLane: (lane: LaneFilter) => void;
  heroCounts?: Record<LaneFilter, number>;
  className?: string;
}

const LANE_ICONS: Record<LaneFilter, React.ReactNode> = {
  All: (
    <svg className="w-3.5 h-3.5 opacity-80 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18M3 12h18" />
    </svg>
  ),
  Gold: (
    <svg className="w-3.5 h-3.5 opacity-80 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v8M9 10h6" />
    </svg>
  ),
  EXP: (
    <svg className="w-3.5 h-3.5 opacity-80 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M19 13l2 2-6 6-2-2" />
    </svg>
  ),
  Mid: (
    <svg className="w-3.5 h-3.5 opacity-80 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7-6-4.6h7.6z" />
    </svg>
  ),
  Roam: (
    <svg className="w-3.5 h-3.5 opacity-80 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Jungle: (
    <svg className="w-3.5 h-3.5 opacity-80 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 21 2c-1 4.5-1.5 6-2.6 11.8A7 7 0 0 1 11 20z" />
    </svg>
  ),
};

export const LaneCarousel: React.FC<LaneCarouselProps> = ({
  selectedLane,
  onSelectLane,
  heroCounts,
  className = '',
}) => {
  const tabRefs = useRef<Record<LaneFilter, HTMLButtonElement | null>>({
    All: null,
    Gold: null,
    EXP: null,
    Mid: null,
    Roam: null,
    Jungle: null,
  });

  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    let nextIndex: number | null = null;

    if (e.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % LANE_FILTERS.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + LANE_FILTERS.length) % LANE_FILTERS.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = LANE_FILTERS.length - 1;
    }

    if (nextIndex !== null) {
      e.preventDefault();
      const nextLane = LANE_FILTERS[nextIndex];
      onSelectLane(nextLane);
      tabRefs.current[nextLane]?.focus();
    }
  };

  return (
    <nav
      aria-label="Lane selection"
      className={`sticky top-0 z-20 w-full border-b border-cyber-border bg-cyber-ground/95 backdrop-blur-md px-2 sm:px-4 py-1.5 overflow-x-auto no-scrollbar scroll-smooth ${className}`}
    >
      <div
        role="tablist"
        aria-label="Lane tabs"
        className="flex items-center gap-1.5 sm:gap-2 min-w-max mx-auto max-w-6xl"
      >
        {LANE_FILTERS.map((lane, index) => {
          const isSelected = selectedLane === lane;
          const count = heroCounts ? heroCounts[lane] : undefined;
          const accessibleName = LANE_FILTER_ACCESSIBLE_NAMES[lane];

          return (
            <button
              key={lane}
              ref={(el) => {
                tabRefs.current[lane] = el;
              }}
              type="button"
              role="tab"
              aria-label={count !== undefined ? `${accessibleName} (${count} heroes)` : accessibleName}
              aria-selected={isSelected}
              tabIndex={isSelected ? 0 : -1}
              data-testid={`lane-tab-${lane}`}
              onClick={() => onSelectLane(lane)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`relative flex items-center justify-center gap-2 min-h-[44px] min-w-[44px] px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm tracking-normal transition-all duration-150 select-none cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 active:scale-95 ${
                isSelected
                  ? 'bg-slate-800/90 border border-slate-700/80 text-slate-100'
                  : 'bg-slate-900/40 border border-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 hover:border-slate-700/60'
              }`}
            >
              {LANE_ICONS[lane]}
              <span>{lane}</span>

              {count !== undefined && (
                <span
                  data-testid={`lane-count-${lane}`}
                  className={`text-[10px] sm:text-xs font-mono font-medium px-1.5 py-0.5 rounded-full ${
                    isSelected
                      ? 'bg-slate-900 text-cyan-400 border border-slate-700/80'
                      : 'bg-slate-900/80 text-slate-500 border border-slate-800/60'
                  }`}
                >
                  {count}
                </span>
              )}

              {isSelected && (
                <span
                  data-testid={`lane-active-indicator-${lane}`}
                  className="absolute bottom-0 inset-x-3 h-[2px] rounded-full bg-cyan-400"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
