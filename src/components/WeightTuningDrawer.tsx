import React, { useEffect, useRef } from 'react';
import type { PowerScoreWeights, WeightPresetKey } from '../types/index.ts';
import {
  computeNormalizedWeights,
  isDefaultWeights,
  PRESETS,
  DEFAULT_WEIGHTS,
} from '../utils/scoringEngine.ts';

export interface WeightTuningDrawerProps {
  isOpen: boolean;
  weights: PowerScoreWeights;
  onWeightsChange: (weights: PowerScoreWeights) => void;
  onClose: () => void;
  onReset: () => void;
}

export const WeightTuningDrawer: React.FC<WeightTuningDrawerProps> = ({
  isOpen,
  weights,
  onWeightsChange,
  onClose,
  onReset,
}) => {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  // Lock background scroll and handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
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
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const normalized = computeNormalizedWeights(weights);
  const isDefault = isDefaultWeights(weights);

  // Swipe/touch handlers for drag handle
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      touchStartYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartYRef.current !== null && e.touches.length > 0) {
      const deltaY = e.touches[0].clientY - touchStartYRef.current;
      if (deltaY > 60) {
        onClose();
        touchStartYRef.current = null;
      }
    }
  };

  const handleTouchEnd = () => {
    touchStartYRef.current = null;
  };

  const handlePresetSelect = (presetKey: WeightPresetKey) => {
    const target = PRESETS[presetKey];
    if (target) {
      onWeightsChange({ ...target.weights });
    }
  };

  const handleWrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
    onWeightsChange({ ...weights, wr: val });
  };

  const handlePrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
    onWeightsChange({ ...weights, pr: val });
  };

  const handleBrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
    onWeightsChange({ ...weights, br: val });
  };

  const handleDampenToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    onWeightsChange({ ...weights, dampenNiche: e.target.checked });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Customize Power Score Weights"
      data-testid="weight-tuning-drawer"
      className="fixed inset-0 z-50 flex items-end justify-center pointer-events-auto"
    >
      {/* Backdrop */}
      <div
        data-testid="weight-drawer-backdrop"
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 bg-black/75 backdrop-blur-xs animate-fade-in transition-opacity"
      />

      {/* Slide-up Container */}
      <div
        ref={panelRef}
        className="relative w-full max-w-lg bg-cyber-card border-t border-cyber-border rounded-t-2xl shadow-2xl z-10 animate-slide-up flex flex-col max-h-[85vh] focus:outline-none"
      >
        {/* Swipe Handle & Header */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="pt-3 pb-2 px-5 flex flex-col items-center border-b border-cyber-border/70 select-none cursor-grab active:cursor-grabbing"
        >
          <div className="w-10 h-1 rounded-full bg-zinc-700/70 mb-3" />
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-indigo-400"
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
              <h2 className="text-sm font-semibold tracking-tight text-zinc-100 font-sans">
                Tune Power Score
              </h2>
            </div>
            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              data-testid="btn-close-weights"
              aria-label="Close weight tuning"
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="px-5 py-4 overflow-y-auto space-y-5">
          {/* Quick Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                Competitive Presets
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(Object.keys(PRESETS) as WeightPresetKey[]).map((key) => {
                const preset = PRESETS[key];
                const isSelected =
                  weights.wr === preset.weights.wr &&
                  weights.pr === preset.weights.pr &&
                  weights.br === preset.weights.br &&
                  weights.dampenNiche === preset.weights.dampenNiche;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handlePresetSelect(key)}
                    data-testid={`preset-chip-${key}`}
                    className={`px-2.5 py-2 rounded-lg text-xs font-medium transition-all text-left border flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-950/60 border-indigo-500 text-indigo-200 shadow-xs'
                        : 'bg-cyber-surface border-cyber-border text-zinc-300 hover:bg-cyber-elevated hover:text-zinc-100 hover:border-zinc-700'
                    }`}
                  >
                    <span className="font-semibold truncate">{preset.label}</span>
                    <span className="text-[10px] text-zinc-400 font-mono mt-1">
                      {preset.weights.wr}/{preset.weights.pr}/{preset.weights.br}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Visual Ratio Bar */}
          <div className="p-3 rounded-lg bg-cyber-surface border border-cyber-border space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
              <span>Effective Allocation:</span>
              <span className="text-zinc-200">
                WR {normalized.wrPct}% · PR {normalized.prPct}% · BR {normalized.brPct}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden flex bg-black border border-zinc-800">
              <div
                style={{ width: `${normalized.wrPct}%` }}
                className="bg-cyan-500 transition-all duration-150"
                title={`Win Rate: ${normalized.wrPct}%`}
              />
              <div
                style={{ width: `${normalized.prPct}%` }}
                className="bg-emerald-500 transition-all duration-150"
                title={`Pick Rate: ${normalized.prPct}%`}
              />
              <div
                style={{ width: `${normalized.brPct}%` }}
                className="bg-rose-500 transition-all duration-150"
                title={`Ban Rate: ${normalized.brPct}%`}
              />
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-4">
            {/* Win Rate Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="slider-wr" className="font-medium text-zinc-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  Win Rate (Effectiveness)
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-400 font-mono text-[11px]">raw: {weights.wr}</span>
                  <span
                    data-testid="pct-wr"
                    className="px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-mono font-medium text-xs tabular-nums"
                  >
                    {normalized.wrPct}%
                  </span>
                </div>
              </div>
              <input
                id="slider-wr"
                data-testid="slider-wr"
                type="range"
                min="0"
                max="100"
                step="1"
                value={weights.wr}
                onChange={handleWrChange}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Pick Rate Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="slider-pr" className="font-medium text-zinc-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Pick Rate (Sample Acceptance)
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-400 font-mono text-[11px]">raw: {weights.pr}</span>
                  <span
                    data-testid="pct-pr"
                    className="px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-mono font-medium text-xs tabular-nums"
                  >
                    {normalized.prPct}%
                  </span>
                </div>
              </div>
              <input
                id="slider-pr"
                data-testid="slider-pr"
                type="range"
                min="0"
                max="100"
                step="1"
                value={weights.pr}
                onChange={handlePrChange}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
            </div>

            {/* Ban Rate Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="slider-br" className="font-medium text-zinc-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  Ban Rate (Draft Threat)
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-400 font-mono text-[11px]">raw: {weights.br}</span>
                  <span
                    data-testid="pct-br"
                    className="px-1.5 py-0.5 rounded bg-rose-950/60 border border-rose-500/40 text-rose-300 font-mono font-medium text-xs tabular-nums"
                  >
                    {normalized.brPct}%
                  </span>
                </div>
              </div>
              <input
                id="slider-br"
                data-testid="slider-br"
                type="range"
                min="0"
                max="100"
                step="1"
                value={weights.br}
                onChange={handleBrChange}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-400"
              />
            </div>
          </div>

          {/* Niche Pick Dampening Toggle */}
          <div className="p-3 rounded-lg bg-cyber-surface border border-cyber-border flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <label
                htmlFor="toggle-dampening"
                className="text-xs font-semibold text-zinc-200 cursor-pointer select-none"
              >
                Cap niche picks (&lt;0.5% PR) at B Tier
              </label>
              <p className="text-[11px] text-zinc-400 leading-normal">
                Prevents low-sample cheese one-tricks from entering S+/S tier. Disable for pure unconstrained statistical ranking.
              </p>
            </div>
            <div className="flex items-center pt-0.5">
              <input
                id="toggle-dampening"
                data-testid="toggle-dampening"
                type="checkbox"
                checked={weights.dampenNiche}
                onChange={handleDampenToggle}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-zinc-950 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-cyber-border bg-cyber-card flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onReset}
            disabled={isDefault}
            data-testid="btn-reset-weights"
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              isDefault
                ? 'opacity-40 cursor-not-allowed text-zinc-500 bg-zinc-900/50 border border-zinc-800'
                : 'text-zinc-300 hover:text-zinc-100 bg-cyber-surface hover:bg-cyber-elevated border border-cyber-border'
            }`}
          >
            Reset to Default
          </button>
          <button
            type="button"
            onClick={onClose}
            data-testid="btn-apply-weights"
            className="px-4 py-2 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-xs active:scale-95 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
