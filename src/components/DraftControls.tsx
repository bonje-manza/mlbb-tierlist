import React, { useState, useEffect, useRef } from 'react';

export interface DraftControlsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isBanPriority: boolean;
  onToggleBanPriority: () => void;
}

export const DraftControls: React.FC<DraftControlsProps> = ({
  searchQuery,
  onSearchChange,
  isBanPriority,
  onToggleBanPriority,
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
      className="w-full flex items-center gap-2"
    >
      {/* Search Input Container */}
      <div className="relative flex-1 flex items-center">
        {/* Search Icon */}
        <div className="absolute left-3 pointer-events-none flex items-center text-slate-400">
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
          className="w-full h-11 pl-9 pr-11 text-xs sm:text-sm rounded-xl bg-slate-900/60 border border-slate-800/80 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600 transition-colors"
        />

        {/* 1-Tap Clear Button */}
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="absolute right-0 top-0 bottom-0 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors active:scale-95"
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
        className={`min-h-[44px] min-w-[44px] px-3.5 sm:px-4 flex items-center justify-center gap-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 select-none border active:scale-95 whitespace-nowrap cursor-pointer ${
          isBanPriority
            ? 'bg-rose-950/50 border-rose-600/60 text-rose-300 shadow-sm shadow-rose-950/50'
            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 hover:border-slate-700'
        }`}
      >
        <svg
          className={`w-4 h-4 shrink-0 transition-colors ${isBanPriority ? 'text-rose-400' : 'text-slate-400'}`}
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
            className="w-1.5 h-1.5 rounded-full bg-rose-400 ml-0.5"
            aria-hidden="true"
          />
        )}
      </button>
    </div>
  );
};
