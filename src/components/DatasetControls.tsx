import React from 'react';
import type { RankTier, TimeWindow } from '../types/index.ts';

export interface DatasetControlsProps {
  rankTier: RankTier;
  onRankTierChange: (rank: RankTier) => void;
  timeWindow: TimeWindow;
  onTimeWindowChange: (window: TimeWindow) => void;
  disabled?: boolean;
  className?: string;
}

export interface OptionItem<T extends string> {
  value: T;
  label: string;
}

export const RANK_OPTIONS: OptionItem<RankTier>[] = [
  { value: 'all', label: 'All Ranks' },
  { value: 'epic', label: 'Epic' },
  { value: 'legend', label: 'Legend' },
  { value: 'mythic', label: 'Mythic' },
  { value: 'honor', label: 'Mythical Honor' },
  { value: 'glory', label: 'Mythical Glory+' },
];

export const TIME_OPTIONS: OptionItem<TimeWindow>[] = [
  { value: '1d', label: 'Past 1 Day' },
  { value: '3d', label: 'Past 3 Days' },
  { value: '7d', label: 'Past 7 Days' },
  { value: '15d', label: 'Past 15 Days' },
  { value: '30d', label: 'Past 30 Days' },
];

export const DatasetControls: React.FC<DatasetControlsProps> = ({
  rankTier,
  onRankTierChange,
  timeWindow,
  onTimeWindowChange,
  disabled = false,
  className = '',
}) => {
  const currentRankLabel = RANK_OPTIONS.find((opt) => opt.value === rankTier)?.label ?? rankTier;
  const currentTimeLabel = TIME_OPTIONS.find((opt) => opt.value === timeWindow)?.label ?? timeWindow;

  return (
    <div
      aria-label="Dataset filters"
      className={`flex items-center gap-2 sm:gap-3 ${className || 'w-full max-w-7xl mx-auto px-2 sm:px-4 py-1.5 justify-between'}`}
    >
      {/* Rank Tier Card & Select */}
      <div className="relative flex-[1.2] sm:flex-initial sm:w-48 md:w-52 min-w-0">
        <label htmlFor="rank-tier-select" className="sr-only">
          Rank Tier
        </label>
        <div
          className={`w-full min-h-[46px] px-3 sm:px-3.5 py-1.5 rounded-lg bg-cyber-card border transition-all flex flex-col justify-center relative ${
            disabled
              ? 'opacity-50 border-cyber-border cursor-not-allowed'
              : 'hover:bg-cyber-hover border-cyber-border hover:border-zinc-700 focus-within:ring-1 focus-within:ring-zinc-600 focus-within:border-zinc-500 cursor-pointer'
          }`}
        >
          <div className="flex items-center justify-between leading-none mb-1">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" aria-hidden="true" />
              <span className="text-xs font-medium text-zinc-400 select-none">
                Rank
              </span>
            </div>
            <svg
              className="w-3.5 h-3.5 text-zinc-500 shrink-0 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <span
            data-testid="rank-tier-label"
            title={currentRankLabel}
            className="text-xs sm:text-sm font-medium text-zinc-100 truncate leading-tight select-none"
          >
            {currentRankLabel}
          </span>
        </div>

        <select
          id="rank-tier-select"
          data-testid="rank-tier-select"
          value={rankTier}
          onChange={(e) => onRankTierChange(e.target.value as RankTier)}
          disabled={disabled}
          aria-label="Rank Tier"
          className="absolute inset-0 w-full h-full min-h-[44px] min-w-[44px] opacity-0 cursor-pointer disabled:cursor-not-allowed"
        >
          {RANK_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-zinc-900 text-zinc-100 py-1">
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Time Window Card & Select */}
      <div className="relative flex-1 sm:flex-initial sm:w-40 md:w-44 min-w-0">
        <label htmlFor="time-window-select" className="sr-only">
          Time Window
        </label>
        <div
          className={`w-full min-h-[46px] px-3 sm:px-3.5 py-1.5 rounded-lg bg-cyber-card border transition-all flex flex-col justify-center relative ${
            disabled
              ? 'opacity-50 border-cyber-border cursor-not-allowed'
              : 'hover:bg-cyber-hover border-cyber-border hover:border-zinc-700 focus-within:ring-1 focus-within:ring-zinc-600 focus-within:border-zinc-500 cursor-pointer'
          }`}
        >
          <div className="flex items-center justify-between leading-none mb-1">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" aria-hidden="true" />
              <span className="text-xs font-medium text-zinc-400 select-none">
                Window
              </span>
            </div>
            <svg
              className="w-3.5 h-3.5 text-zinc-500 shrink-0 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <span
            data-testid="time-window-label"
            title={currentTimeLabel}
            className="text-xs sm:text-sm font-medium text-zinc-100 truncate leading-tight select-none"
          >
            {currentTimeLabel}
          </span>
        </div>

        <select
          id="time-window-select"
          data-testid="time-window-select"
          value={timeWindow}
          onChange={(e) => onTimeWindowChange(e.target.value as TimeWindow)}
          disabled={disabled}
          aria-label="Time Window"
          className="absolute inset-0 w-full h-full min-h-[44px] min-w-[44px] opacity-0 cursor-pointer disabled:cursor-not-allowed"
        >
          {TIME_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-zinc-900 text-zinc-100 py-1">
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
