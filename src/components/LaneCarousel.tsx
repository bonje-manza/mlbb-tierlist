import React, { useRef } from 'react';
import type { LaneFilter } from '../types/index.ts';
import { LANE_FILTERS, LANE_FILTER_ACCESSIBLE_NAMES } from '../utils/laneFilter.ts';

export interface LaneCarouselProps {
  selectedLane: LaneFilter;
  onSelectLane: (lane: LaneFilter) => void;
  heroCounts?: Record<LaneFilter, number>;
  className?: string;
}

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
      className={`sticky top-0 z-20 w-full border-b border-cyber-border bg-cyber-ground/95 backdrop-blur-md px-2 sm:px-4 py-2 overflow-x-auto no-scrollbar scroll-smooth ${className}`}
    >
      <div
        role="tablist"
        aria-label="Lane tabs"
        className="flex items-center gap-1.5 sm:gap-2 min-w-max mx-auto max-w-5xl"
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
              className={`relative flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm tracking-wide transition-all duration-150 select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 active:scale-95 ${
                isSelected
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/80 text-cyan-300 shadow-md shadow-cyan-500/20'
                  : 'bg-cyber-card/60 border border-cyber-border text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 hover:border-slate-700'
              }`}
            >
              <span>{lane}</span>

              {count !== undefined && (
                <span
                  data-testid={`lane-count-${lane}`}
                  className={`text-[10px] sm:text-xs font-mono font-semibold px-1.5 py-0.5 rounded-full ${
                    isSelected
                      ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-500/50'
                      : 'bg-slate-900/90 text-slate-400 border border-slate-800'
                  }`}
                >
                  {count}
                </span>
              )}

              {isSelected && (
                <span
                  data-testid={`lane-active-indicator-${lane}`}
                  className="absolute bottom-1 left-3 right-3 h-0.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4]"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
