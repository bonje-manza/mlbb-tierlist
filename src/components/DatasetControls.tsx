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
  return (
    <div
      aria-label="Dataset filters"
      className="w-full max-w-6xl mx-auto px-2 sm:px-4 py-2 flex items-center justify-between gap-2 sm:gap-4"
    >
      {/* Rank Tier Select */}
      <div className="relative flex-1 min-w-0">
        <label htmlFor="rank-tier-select" className="sr-only">
          Rank Tier
        </label>
        <div className="relative flex items-center">
          <span className="absolute left-2.5 sm:left-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-cyan-400/80 pointer-events-none select-none">
            Rank
          </span>
          <select
            id="rank-tier-select"
            data-testid="rank-tier-select"
            value={rankTier}
            onChange={(e) => onRankTierChange(e.target.value as RankTier)}
            disabled={disabled}
            aria-label="Rank Tier"
            className="w-full min-h-[44px] min-w-[44px] pl-13 sm:pl-15 pr-8 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 text-xs sm:text-sm font-semibold text-slate-100 border border-slate-700/80 hover:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 cursor-pointer transition-all duration-150 appearance-none shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {RANK_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-100 py-1">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-2.5 sm:right-3 pointer-events-none text-slate-400 flex items-center">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Time Window Select */}
      <div className="relative flex-1 min-w-0">
        <label htmlFor="time-window-select" className="sr-only">
          Time Window
        </label>
        <div className="relative flex items-center">
          <span className="absolute left-2.5 sm:left-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-purple-300/80 pointer-events-none select-none">
            Period
          </span>
          <select
            id="time-window-select"
            data-testid="time-window-select"
            value={timeWindow}
            onChange={(e) => onTimeWindowChange(e.target.value as TimeWindow)}
            disabled={disabled}
            aria-label="Time Window"
            className="w-full min-h-[44px] min-w-[44px] pl-15 sm:pl-17 pr-8 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 text-xs sm:text-sm font-semibold text-slate-100 border border-slate-700/80 hover:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 cursor-pointer transition-all duration-150 appearance-none shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {TIME_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-100 py-1">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-2.5 sm:right-3 pointer-events-none text-slate-400 flex items-center">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
