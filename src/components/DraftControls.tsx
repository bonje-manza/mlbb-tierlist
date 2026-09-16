import React, { useState, useEffect, useRef } from 'react';

export interface DraftControlsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isBanPriority: boolean;
  onToggleBanPriority: () => void;
  onOpenWeights?: () => void;
  isCustomWeights?: boolean;
  weightsSummary?: string;
  onResetWeights?: () => void;
}

export const DraftControls: React.FC<DraftControlsProps> = ({
  searchQuery,
  onSearchChange,
  isBanPriority,
  onToggleBanPriority,
  onOpenWeights,
  isCustomWeights = false,
  weightsSummary,
  onResetWeights,
}) => {
  const [inputValue, setInputValue] = useState(searchQuery);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync internal input value with external searchQuery and cancel any pending keystroke timer
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    setInputValue(searchQuery);
  }, [searchQuery]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value;
    setInputValue(nextVal);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      onSearchChange(nextVal);
    }, 150);
  };

  const handleClear = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    setInputValue('');
    onSearchChange('');
  };

  return (
    <div
      role="search"
      aria-label="Draft controls and search"
      className="w-full flex flex-col gap-2"
    >
      <div className="w-full flex items-center gap-2">
        {/* Search Input Container */}
        <div className="relative flex-1 flex items-center">
          {/* Search Icon */}
          <div className="absolute left-3 pointer-events-none flex items-center text-zinc-500">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Search heroes..."
            aria-label="Search hero by name"
            className="w-full h-11 pl-9 pr-11 text-xs sm:text-sm rounded-lg bg-cyber-card border border-cyber-border text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-600 transition-all font-sans"
          />

          {/* 1-Tap Clear Button */}
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search"
              className="absolute right-0 top-0 bottom-0 min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition-colors active:scale-95 cursor-pointer"
            >
              <svg
                className="w-4 h-4"
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
          )}
        </div>

        {/* Ban Priority Toggle Pill Button */}
        <button
          type="button"
          onClick={onToggleBanPriority}
          aria-pressed={isBanPriority}
          aria-label="Toggle Ban Priority"
          className={`min-h-[44px] min-w-[44px] px-3.5 sm:px-4 flex items-center justify-center gap-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 select-none border active:scale-95 whitespace-nowrap cursor-pointer ${
            isBanPriority
              ? 'bg-rose-950/40 border-rose-600/40 text-rose-300 shadow-xs'
              : 'bg-cyber-card border-cyber-border text-zinc-300 hover:text-zinc-100 hover:bg-cyber-hover hover:border-zinc-700'
          }`}
        >
          <svg
            className={`w-4 h-4 shrink-0 transition-colors ${isBanPriority ? 'text-rose-400' : 'text-zinc-400'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
          <span>Ban Priority</span>
          {isBanPriority && (
            <span
              data-testid="ban-priority-active-dot"
              className="w-1.5 h-1.5 rounded-full bg-rose-500 ml-0.5"
              aria-hidden="true"
            />
          )}
        </button>

        {/* Weights Tuning Button */}
        {onOpenWeights && (
          <button
            type="button"
            onClick={onOpenWeights}
            aria-label="Tune Power Score weights"
            data-testid="btn-open-weights"
            className={`min-h-[44px] min-w-[44px] px-3 sm:px-3.5 flex items-center justify-center gap-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 select-none border active:scale-95 whitespace-nowrap cursor-pointer ${
              isCustomWeights
                ? 'bg-indigo-950/40 border-indigo-600/50 text-indigo-300 shadow-xs'
                : 'bg-cyber-card border-cyber-border text-zinc-300 hover:text-zinc-100 hover:bg-cyber-hover hover:border-zinc-700'
            }`}
          >
            <svg
              className={`w-4 h-4 shrink-0 transition-colors ${isCustomWeights ? 'text-indigo-400' : 'text-zinc-400'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
            <span className="hidden sm:inline">Weights</span>
            {isCustomWeights && (
              <span
                data-testid="weights-active-dot"
                className="w-1.5 h-1.5 rounded-full bg-indigo-500 ml-0.5"
                aria-hidden="true"
              />
            )}
          </button>
        )}
      </div>

      {/* Custom Formula Active Badge Chip */}
      {isCustomWeights && (
        <div
          data-testid="custom-formula-chip"
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 animate-fadeIn"
        >
          <div className="flex items-center gap-2 font-mono text-[11px] sm:text-xs truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
            <span className="font-semibold text-indigo-300">Custom Weights:</span>
            <span className="text-zinc-300 truncate">{weightsSummary || 'Custom'}</span>
          </div>
          {onResetWeights && (
            <button
              type="button"
              onClick={onResetWeights}
              data-testid="btn-reset-weights-chip"
              aria-label="Reset weights to official default"
              className="ml-2 text-zinc-400 hover:text-zinc-100 flex items-center gap-1 text-[11px] hover:underline cursor-pointer shrink-0"
            >
              <span>Reset</span>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
