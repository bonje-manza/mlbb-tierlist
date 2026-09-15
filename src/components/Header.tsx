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

export type FreshnessTone = 'fresh' | 'aging' | 'stale';

export interface FreshnessStatus {
  text: string;
  tone: FreshnessTone;
}

export function getFreshnessStatus(isoString?: string, nowMs: number = Date.now()): FreshnessStatus {
  const baseText = formatUtcFreshness(isoString);
  if (!isoString) return { text: baseText, tone: 'stale' };
  const parsed = new Date(isoString).getTime();
  if (isNaN(parsed)) return { text: baseText, tone: 'stale' };
  const ageMs = nowMs - parsed;
  if (ageMs < 0) return { text: baseText, tone: 'fresh' };
  const ageHours = ageMs / (1000 * 60 * 60);
  if (ageHours < 24) return { text: baseText, tone: 'fresh' };
  const ageDays = Math.floor(ageHours / 24);
  const rel = ageDays >= 1 ? `${ageDays}d ago` : `${Math.floor(ageHours)}h ago`;
  return { text: `${baseText} · ${rel}`, tone: 'aging' };
}

const FRESHNESS_DOT: Record<FreshnessTone, string> = {
  fresh: 'bg-emerald-400',
  aging: 'bg-amber-400',
  stale: 'bg-amber-400',
};

export const Header: React.FC<HeaderProps> = ({
  updatedAt,
  patchVersion,
}) => {
  const freshness = getFreshnessStatus(updatedAt);

  return (
    <header className="w-full border-b border-cyber-border bg-cyber-ground/95 backdrop-blur-md px-3 py-1.5 sm:px-6">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
        {/* Title & Brand */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center w-6 h-6 rounded-lg bg-cyan-400 shadow-md shadow-cyan-500/20">
            <span className="text-xs font-black tracking-tighter text-slate-950">M</span>
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black tracking-tight text-white leading-none">
              MLBB Meta Radar
            </h1>
            <p className="text-[11px] font-medium text-slate-400 leading-tight mt-0.5">
              Empirical Moonton GMS Meta
            </p>
          </div>
        </div>

        {/* Patch Version & Data Freshness Badges */}
        <div className="flex flex-col items-end gap-1 text-right">
          <div className="flex items-center gap-1.5">
            <span
              data-testid="patch-version-tag"
              className="text-[11px] sm:text-xs font-mono font-semibold tabular-nums px-2 py-0.5 rounded-md bg-slate-800/90 text-cyan-300 border border-cyan-500/30"
            >
              {patchVersion ? `Patch ${patchVersion}` : 'Patch --'}
            </span>
          </div>
          <span
            data-testid="data-freshness-badge"
            title={
              freshness.tone === 'fresh'
                ? 'Telemetry is current.'
                : 'Telemetry may be stale — last successful sync shown.'
            }
            className="text-[10px] sm:text-[11px] font-mono tabular-nums text-slate-300 flex items-center gap-1"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${FRESHNESS_DOT[freshness.tone]}`} />
            {freshness.text}
          </span>
        </div>
      </div>
    </header>
  );
};
