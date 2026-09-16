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
      className={`sticky top-0 md:static z-20 w-full border-b md:border-b-0 border-cyber-border/80 bg-cyber-ground/90 md:bg-transparent backdrop-blur-md md:backdrop-blur-none px-2 sm:px-4 py-1.5 overflow-x-auto no-scrollbar scroll-smooth ${className}`}
    >
      <div
        role="tablist"
        aria-label="Lane tabs"
        className="flex items-center gap-1.5 sm:gap-2 min-w-max md:min-w-0 mx-auto max-w-7xl md:justify-center md:flex-wrap"
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
              className={`relative flex items-center justify-center gap-2 min-h-[44px] min-w-[44px] px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm select-none cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 active:scale-95 transition-all duration-150 ${
                isSelected
                  ? 'bg-[#222228] text-white border border-[#383842] shadow-xs'
                  : 'bg-transparent border border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-cyber-card hover:border-cyber-border'
              }`}
            >
              <span className={isSelected ? 'text-zinc-200' : 'text-zinc-500'}>
                {LANE_ICONS[lane]}
              </span>
              <span className={isSelected ? 'font-medium text-white' : 'font-normal'}>{lane}</span>

              {count !== undefined && (
                <span
                  data-testid={`lane-count-${lane}`}
                  className={`text-[11px] sm:text-xs font-mono font-medium tabular-nums px-1.5 py-0.5 rounded ${
                    isSelected
                      ? 'bg-black/60 text-zinc-200 border border-zinc-700/60'
                      : 'bg-zinc-900/60 text-zinc-500 border border-zinc-800/80'
                  }`}
                >
                  {count}
                </span>
              )}

              {isSelected && (
                <span
                  data-testid={`lane-active-indicator-${lane}`}
                  className="absolute bottom-0 inset-x-2.5 h-[2px] rounded-full bg-zinc-200 shadow-[0_0_6px_rgba(255,255,255,0.4)]"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
