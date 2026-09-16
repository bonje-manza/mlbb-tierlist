import React from 'react';
import type { RankTier, TimeWindow } from '../types/index.ts';

export interface DatasetControlsProps {
  rankTier: RankTier;
  onRankTierChange: (rank: RankTier) => void;
  timeWindow: TimeWindow;
  onTimeWindowChange: (window: TimeWindow) => void;
  disabled?: boolean;
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
}) => {
  const currentRankLabel = RANK_OPTIONS.find((opt) => opt.value === rankTier)?.label ?? rankTier;
  const currentTimeLabel = TIME_OPTIONS.find((opt) => opt.value === timeWindow)?.label ?? timeWindow;

  return (
    <div
      aria-label="Dataset filters"
      className="w-full max-w-6xl mx-auto px-2 sm:px-4 py-2 flex items-center justify-between gap-2 sm:gap-4"
    >
      {/* Rank Tier Card & Select */}
      <div className="relative flex-1 min-w-0">
        <label htmlFor="rank-tier-select" className="sr-only">
          Rank Tier
        </label>
        <div
          className={`w-full min-h-[46px] px-3 py-1.5 rounded-xl bg-slate-900/90 border transition-all flex flex-col justify-center shadow-sm relative ${
            disabled
              ? 'opacity-50 border-slate-800 cursor-not-allowed'
              : 'hover:bg-slate-800/90 border-slate-700/80 hover:border-cyan-500/50 focus-within:ring-2 focus-within:ring-cyan-500/50 focus-within:border-cyan-500 cursor-pointer'
          }`}
        >
          <div className="flex items-center justify-between leading-none mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400/90 select-none">
              Rank
            </span>
            <svg
              className="w-3.5 h-3.5 text-slate-400 shrink-0 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <span className="text-xs sm:text-sm font-semibold text-slate-100 truncate leading-tight select-none pr-3">
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
            <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-100 py-1">
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Time Window Card & Select */}
      <div className="relative flex-1 min-w-0">
        <label htmlFor="time-window-select" className="sr-only">
          Time Window
        </label>
        <div
          className={`w-full min-h-[46px] px-3 py-1.5 rounded-xl bg-slate-900/90 border transition-all flex flex-col justify-center shadow-sm relative ${
            disabled
              ? 'opacity-50 border-slate-800 cursor-not-allowed'
              : 'hover:bg-slate-800/90 border-slate-700/80 hover:border-purple-500/50 focus-within:ring-2 focus-within:ring-purple-500/50 focus-within:border-purple-500 cursor-pointer'
          }`}
        >
          <div className="flex items-center justify-between leading-none mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300/90 select-none">
              Period
            </span>
            <svg
              className="w-3.5 h-3.5 text-slate-400 shrink-0 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <span className="text-xs sm:text-sm font-semibold text-slate-100 truncate leading-tight select-none pr-3">
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
            <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-100 py-1">
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
