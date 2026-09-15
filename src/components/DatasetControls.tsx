import React from 'react';
import type { RankTier, TimeWindow } from '../types/index.ts';

export interface DatasetControlsProps {
  rankTier: RankTier;
  onRankTierChange: (rank: RankTier) => void;
  timeWindow: TimeWindow;
  onTimeWindowChange: (window: TimeWindow) => void;
  disabled?: boolean;
}

interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentGroupProps<T extends string> {
  groupLabel: string;
  options: SegmentOption<T>[];
  selectedValue: T;
  onChange: (val: T) => void;
  disabled?: boolean;
  activeColorTheme: 'cyan' | 'purple';
}

function SegmentGroup<T extends string>({
  groupLabel,
  options,
  selectedValue,
  onChange,
  disabled = false,
  activeColorTheme,
}: SegmentGroupProps<T>) {
  const activeStyle =
    activeColorTheme === 'cyan'
      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 shadow-sm shadow-cyan-500/20'
      : 'bg-purple-500/20 text-purple-300 border-purple-400/50 shadow-sm shadow-purple-500/20';

  return (
    <div
      role="radiogroup"
      aria-label={groupLabel}
      className="inline-flex p-0.5 rounded-xl bg-cyber-card/60 border border-cyber-border"
    >
      {options.map(({ value, label }) => {
        const isSelected = selectedValue === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={label}
            disabled={disabled}
            onClick={() => {
              if (!disabled && !isSelected) {
                onChange(value);
              }
            }}
            className={`min-h-[44px] min-w-[44px] px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 select-none flex items-center justify-center border ${
              isSelected
                ? activeStyle
                : 'text-slate-400 hover:text-slate-200 border-transparent active:scale-95'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

const RANK_OPTIONS: SegmentOption<RankTier>[] = [
  { value: 'mythic', label: 'Mythic' },
  { value: 'all', label: 'All Ranks' },
];

const TIME_OPTIONS: SegmentOption<TimeWindow>[] = [
  { value: '1d', label: '1 Day' },
  { value: '7d', label: '7 Days' },
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
      className="w-full max-w-5xl mx-auto px-2 sm:px-4 py-1.5 flex items-center justify-between gap-2"
    >
      <SegmentGroup<RankTier>
        groupLabel="Rank Tier"
        options={RANK_OPTIONS}
        selectedValue={rankTier}
        onChange={onRankTierChange}
        disabled={disabled}
        activeColorTheme="cyan"
      />

      <SegmentGroup<TimeWindow>
        groupLabel="Time Window"
        options={TIME_OPTIONS}
        selectedValue={timeWindow}
        onChange={onTimeWindowChange}
        disabled={disabled}
        activeColorTheme="purple"
      />
    </div>
  );
};
