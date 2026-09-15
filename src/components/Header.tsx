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
    <header className="w-full border-b border-cyber-border bg-cyber-ground/95 backdrop-blur-md px-3 py-2 sm:px-6">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Title & Brand */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800/90 border border-slate-700/60">
            <span className="text-xs font-bold tracking-tighter text-slate-300">M</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-100 leading-none">
                MLBB HERO TIER LIST
              </h1>
              <span
                data-testid="patch-version-tag"
                className="text-[10px] sm:text-[11px] font-mono font-medium tabular-nums px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800"
              >
                {patchVersion ? `Patch ${patchVersion}` : 'Patch --'}
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-normal text-slate-400 leading-tight mt-0.5 hidden sm:block">
              Empirical Moonton GMS Telemetry & Composite Power Score
            </p>
          </div>
        </div>

        {/* Data Freshness Badge */}
        <div className="flex items-center text-right">
          <span
            data-testid="data-freshness-badge"
            title={
              freshness.tone === 'fresh'
                ? 'Telemetry is current.'
                : 'Telemetry may be stale — last successful sync shown.'
            }
            className="text-[10px] sm:text-[11px] font-mono tabular-nums text-slate-400 flex items-center gap-1.5 bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-800/80"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${FRESHNESS_DOT[freshness.tone]} opacity-80`} />
            {freshness.text}
          </span>
        </div>
      </div>
    </header>
  );
};
