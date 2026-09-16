import React from 'react';

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

export interface HeaderProps {
  updatedAt?: string;
  patchVersion?: string;
  title?: string;
  children?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  updatedAt,
  patchVersion,
  children,
}) => {
  const freshness = getFreshnessStatus(updatedAt);

  return (
    <header className="w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-3 py-2.5 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Brand & Patch Version */}
        <div className="flex items-center justify-between md:justify-start gap-3">
          {/* Patch and Title details */}
          <div className="flex items-center gap-3">
            {/* Esports Radar Emblem */}
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 via-slate-800 to-slate-900 border border-cyan-500/30 text-cyan-400 shadow-sm shadow-cyan-950/40 shrink-0">
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black tracking-tight text-white uppercase leading-none">
                  MLBB Meta Radar
                </h1>
                <span
                  data-testid="patch-version-tag"
                  className="text-[10px] sm:text-xs font-mono font-semibold tabular-nums px-2 py-0.5 rounded-full bg-slate-900 text-cyan-300 border border-slate-800 shadow-sm"
                >
                  {patchVersion ? `Patch ${patchVersion}` : 'Patch --'}
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400 leading-tight mt-0.5 hidden sm:block">
                Moonton GMS Telemetry & Composite Power Score
              </p>
            </div>
          </div>

          {/* Right Side: Optional Children + Single Responsive Freshness Badge */}
          <div className="flex items-center gap-3">
            {children}
            <span
              data-testid="data-freshness-badge"
              title={
                freshness.tone === 'fresh'
                  ? 'Telemetry is current.'
                  : 'Telemetry may be stale — last successful sync shown.'
              }
              className="text-[10px] sm:text-xs font-mono tabular-nums text-slate-400 flex items-center gap-1.5 sm:gap-2 bg-slate-900/80 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border border-slate-800 shrink-0"
            >
              <span className={`w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full ${FRESHNESS_DOT[freshness.tone]} opacity-90`} />
              {freshness.text}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
