import React from 'react';

export interface HeaderProps {
  updatedAt?: string;
  patchVersion?: string;
  title?: string;
}

export function formatUtcFreshness(isoString?: string): string {
  if (!isoString) return 'Data updated: Pending';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return `Data updated: ${isoString}`;
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const min = String(d.getUTCMinutes()).padStart(2, '0');
    return `Data updated: ${yyyy}-${mm}-${dd} ${hh}:${min} UTC`;
  } catch {
    return `Data updated: ${isoString}`;
  }
}

export const Header: React.FC<HeaderProps> = ({
  updatedAt,
  patchVersion,
}) => {
  const freshnessText = formatUtcFreshness(updatedAt);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-cyber-border bg-cyber-ground/95 backdrop-blur-md px-3 py-2.5 sm:px-6">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
        {/* Title & Brand */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-tr from-pink-600 to-amber-500 shadow-md shadow-pink-500/20">
            <span className="text-xs font-black tracking-tighter text-white">M</span>
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black tracking-tight text-white leading-none">
              MLBB Meta Radar
            </h1>
            <p className="text-[10px] font-medium text-slate-400 leading-tight mt-0.5">
              Empirical Moonton GMS Meta
            </p>
          </div>
        </div>

        {/* Patch Version & Data Freshness Badges */}
        <div className="flex flex-col items-end gap-1 text-right">
          <div className="flex items-center gap-1.5">
            <span
              data-testid="patch-version-tag"
              className="text-[10px] sm:text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-800/90 text-cyan-300 border border-cyan-500/30"
            >
              {patchVersion ? `Patch ${patchVersion}` : 'Patch --'}
            </span>
          </div>
          <span
            data-testid="data-freshness-badge"
            className="text-[9px] sm:text-[10px] font-mono text-slate-400 flex items-center gap-1"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {freshnessText}
          </span>
        </div>
      </div>
    </header>
  );
};
