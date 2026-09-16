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
    <header className="w-full border-b border-[#222226] bg-[#09090b]/95 backdrop-blur-md px-3 py-2.5 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand & Patch Version */}
        <div className="flex items-center gap-3">
          {/* Linear Geometric Crosshair Emblem */}
          <div className="relative flex items-center justify-center w-7 h-7 rounded-md bg-[#16161a] border border-[#27272f] text-zinc-300 shrink-0">
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="7" strokeDasharray="2 2" />
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold tracking-tight text-zinc-100 leading-none">
                MLBB Meta Radar
              </h1>
              <span
                data-testid="patch-version-tag"
                className="text-[11px] font-mono font-medium tabular-nums px-2 py-0.5 rounded bg-[#141418] text-zinc-400 border border-[#222226]"
              >
                {patchVersion ? `Patch ${patchVersion}` : 'Patch --'}
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-normal leading-tight mt-0.5 hidden sm:block">
              Ranked draft telemetry · Moonton GMS
            </p>
          </div>
        </div>

        {/* Right Side: Optional Children + Single Responsive Freshness Badge */}
        <div className="flex items-center gap-2 sm:gap-3">
          {children}
          <span
            data-testid="data-freshness-badge"
            title={
              freshness.tone === 'fresh'
                ? 'Telemetry is current.'
                : 'Telemetry may be stale - last successful sync shown.'
            }
            className="text-xs font-mono tabular-nums text-zinc-400 flex items-center gap-2 bg-[#121215] px-2.5 py-1 rounded-md border border-[#222226] shrink-0"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${FRESHNESS_DOT[freshness.tone]} ${
                freshness.tone === 'fresh' ? 'animate-pulse' : ''
              }`}
            />
            {freshness.text}
          </span>
        </div>
      </div>
    </header>
  );
};
