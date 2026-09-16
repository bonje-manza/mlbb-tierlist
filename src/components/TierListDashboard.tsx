import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Tier, TierListDataset, NormalizedHero, LaneFilter, RankTier, TimeWindow } from '../types/index.ts';
import { Header } from './Header.tsx';
import { DatasetControls } from './DatasetControls.tsx';
import { LaneCarousel } from './LaneCarousel.tsx';
import { DraftControls } from './DraftControls.tsx';
import { TierSection, EmptyTierRow } from './TierSection.tsx';
import { HeroTile } from './HeroTile.tsx';
import { EmptyState } from './EmptyState.tsx';
import { HeroDetailDrawer } from './HeroDetailDrawer.tsx';
import { filterHeroesByLane, calculateLaneCounts } from '../utils/laneFilter.ts';
import { filterHeroesBySearch, sortHeroesByBanRate } from '../utils/draftFilter.ts';

export type DatasetKey = `${RankTier}-${TimeWindow}`;

export function getDatasetKey(rank: RankTier, window: TimeWindow): DatasetKey {
  return `${rank}-${window}`;
}

export function getDatasetUrl(
  rank: RankTier,
  window: TimeWindow,
  customDataUrl?: string
): string {
  // If custom dataUrl is provided and we are requesting initial default mythic-1d:
  if (customDataUrl && rank === 'mythic' && window === '1d') {
    return customDataUrl;
  }

  if (
    customDataUrl &&
    !customDataUrl.endsWith('/tierlist-mythic-1d.json') &&
    !customDataUrl.endsWith('meta-tierlist.json')
  ) {
    const lastSlash = customDataUrl.lastIndexOf('/');
    const baseDir = lastSlash > 0 ? customDataUrl.substring(0, lastSlash) : '/data';
    return `${baseDir}/tierlist-${rank}-${window}.json`;
  }

  return `/data/tierlist-${rank}-${window}.json`;
}

export interface TierListDashboardProps {
  dataset?: TierListDataset;
  datasets?: Partial<Record<DatasetKey, TierListDataset>>;
  dataUrl?: string;
  onSelectHero?: (hero: NormalizedHero) => void;
}

const ORDERED_TIERS: Tier[] = ['S+', 'S', 'A', 'B', 'C', 'D'];

export const RANK_LABEL: Record<RankTier, string> = {
  all: 'All Ranks',
  epic: 'Epic',
  legend: 'Legend',
  mythic: 'Mythic',
  honor: 'Mythical Honor',
  glory: 'Mythical Glory+',
};

export const WINDOW_LABEL: Record<TimeWindow, string> = {
  '1d': '1 Day',
  '3d': '3 Days',
  '7d': '7 Days',
  '15d': '15 Days',
  '30d': '30 Days',
};

const VALID_RANKS: RankTier[] = ['all', 'epic', 'legend', 'mythic', 'honor', 'glory'];
const VALID_WINDOWS: TimeWindow[] = ['1d', '3d', '7d', '15d', '30d'];

export function resolveInitialRank(initialRank?: RankTier): RankTier {
  if (initialRank && VALID_RANKS.includes(initialRank)) return initialRank;
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const urlRank = params.get('rank') as RankTier;
    if (urlRank && VALID_RANKS.includes(urlRank)) return urlRank;
    try {
      const storedRank = localStorage.getItem('mlbb_tierlist_rank') as RankTier;
      if (storedRank && VALID_RANKS.includes(storedRank)) return storedRank;
    } catch {
      // ignore
    }
  }
  return 'mythic';
}

export function resolveInitialWindow(initialWindow?: TimeWindow): TimeWindow {
  if (initialWindow && VALID_WINDOWS.includes(initialWindow)) return initialWindow;
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const urlWindow = params.get('window') as TimeWindow;
    if (urlWindow && VALID_WINDOWS.includes(urlWindow)) return urlWindow;
    try {
      const storedWindow = localStorage.getItem('mlbb_tierlist_window') as TimeWindow;
      if (storedWindow && VALID_WINDOWS.includes(storedWindow)) return storedWindow;
    } catch {
      // ignore
    }
  }
  return '1d';
}

export function syncUrlAndStorage(rank: RankTier, windowType: TimeWindow) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('mlbb_tierlist_rank', rank);
    localStorage.setItem('mlbb_tierlist_window', windowType);
  } catch {
    // ignore
  }

  try {
    const url = new URL(window.location.href);
    url.searchParams.set('rank', rank);
    url.searchParams.set('window', windowType);
    window.history.replaceState(null, '', url.toString());
  } catch {
    // ignore
  }
}

export const TierListDashboard: React.FC<TierListDashboardProps> = ({
  dataset: initialDataset,
  datasets,
  dataUrl = '/data/tierlist-mythic-1d.json',
  onSelectHero,
}) => {
  const [rankTier, setRankTier] = useState<RankTier>(() =>
    resolveInitialRank(initialDataset?.rankTier)
  );
  const [timeWindow, setTimeWindow] = useState<TimeWindow>(() =>
    resolveInitialWindow(initialDataset?.timeWindow)
  );

  const initialKey = getDatasetKey(rankTier, timeWindow);

  const [datasetCache, setDatasetCache] = useState<Record<DatasetKey, TierListDataset>>(() => {
    const map = {} as Record<DatasetKey, TierListDataset>;
    if (datasets) {
      for (const [k, v] of Object.entries(datasets)) {
        if (v) map[k as DatasetKey] = v;
      }
    }
    if (initialDataset) {
      const key = getDatasetKey(initialDataset.rankTier, initialDataset.timeWindow);
      map[key] = initialDataset;
    }
    return map;
  });

  const [data, setData] = useState<TierListDataset | null>(() => {
    if (initialDataset) return initialDataset;
    if (datasets && datasets[initialKey]) return datasets[initialKey]!;
    return null;
  });

  const [loading, setLoading] = useState<boolean>(
    !initialDataset && !(datasets && datasets[initialKey])
  );
  const [error, setError] = useState<string | null>(null);
  const [selectedLane, setSelectedLane] = useState<LaneFilter>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isBanPriority, setIsBanPriority] = useState<boolean>(false);
  const [selectedHero, setSelectedHero] = useState<NormalizedHero | null>(null);
  // Empty tiers collapse to a single compact row; expandable per tier.
  const [expandedEmptyTiers, setExpandedEmptyTiers] = useState<Record<Tier, boolean>>({
    'S+': false,
    'S': false,
    'A': false,
    'B': false,
    'C': false,
    'D': false,
  });

  const toggleEmptyTier = (tier: Tier) => {
    setExpandedEmptyTiers((prev) => ({ ...prev, [tier]: !prev[tier] }));
  };

  const activeRequestKeyRef = useRef<DatasetKey | null>(null);

  const handleSelectHero = (hero: NormalizedHero) => {
    setSelectedHero(hero);
    onSelectHero?.(hero);
  };

  const loadDataset = async (rank: RankTier, window: TimeWindow) => {
    const key = getDatasetKey(rank, window);
    if (datasetCache[key]) {
      setData(datasetCache[key]);
      setLoading(false);
      setError(null);
      return;
    }

    activeRequestKeyRef.current = key;
    setLoading(true);
    setError(null);
    try {
      const url = getDatasetUrl(rank, window, dataUrl);
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to load tier list telemetry: HTTP ${res.status} ${res.statusText}`);
      }
      const json: TierListDataset = await res.json();
      if (activeRequestKeyRef.current !== key) return;
      setDatasetCache((prev) => ({ ...prev, [key]: json }));
      setData(json);
    } catch (err: unknown) {
      if (activeRequestKeyRef.current !== key) return;
      const message = err instanceof Error ? err.message : 'Failed to load tier list telemetry';
      setError(message);
    } finally {
      if (activeRequestKeyRef.current === key) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (initialDataset) {
      const key = getDatasetKey(initialDataset.rankTier, initialDataset.timeWindow);
      setDatasetCache((prev) => ({ ...prev, [key]: initialDataset }));
      setData(initialDataset);
      setLoading(false);
      setError(null);
    }
  }, [initialDataset]);

  useEffect(() => {
    if (datasets) {
      setDatasetCache((prev) => {
        const next = { ...prev };
        for (const [k, v] of Object.entries(datasets)) {
          if (v) next[k as DatasetKey] = v;
        }
        return next;
      });
    }
  }, [datasets]);

  useEffect(() => {
    let ignore = false;
    const key = getDatasetKey(rankTier, timeWindow);
    if (datasetCache[key]) {
      setData(datasetCache[key]);
      setLoading(false);
      setError(null);
      return;
    }

    activeRequestKeyRef.current = key;
    setLoading(true);
    setError(null);
    const url = getDatasetUrl(rankTier, timeWindow, dataUrl);

    fetch(url)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load tier list telemetry: HTTP ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then((json: TierListDataset) => {
        if (ignore || activeRequestKeyRef.current !== key) return;
        setDatasetCache((prev) => ({ ...prev, [key]: json }));
        setData(json);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (ignore || activeRequestKeyRef.current !== key) return;
        const message = err instanceof Error ? err.message : 'Failed to load tier list telemetry';
        setError(message);
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [rankTier, timeWindow]);

  // Synchronize open hero detail drawer when dataset changes
  useEffect(() => {
    if (selectedHero && data?.heroes) {
      const updatedHero = data.heroes.find((h) => h.id === selectedHero.id);
      if (updatedHero && updatedHero !== selectedHero) {
        setSelectedHero(updatedHero);
      }
    }
  }, [data]);

  const heroCounts = useMemo(() => {
    if (!data?.heroes) return undefined;
    return calculateLaneCounts(data.heroes);
  }, [data?.heroes]);

  // Composition: Lane Filter + Case-insensitive Debounced Search
  const filteredHeroes = useMemo(() => {
    if (!data?.heroes) return [];
    const laneFiltered = filterHeroesByLane(data.heroes, selectedLane);
    return filterHeroesBySearch(laneFiltered, searchQuery);
  }, [data?.heroes, selectedLane, searchQuery]);

  // When Ban Priority is active, sort all visible heroes strictly by descending banRate
  const banSortedHeroes = useMemo(() => {
    if (!isBanPriority) return [];
    return sortHeroesByBanRate(filteredHeroes);
  }, [isBanPriority, filteredHeroes]);

  // Cross-lane recovery: heroes matching the search in the full pool
  // but hidden by the active lane filter.
  const crossLaneMatches = useMemo(() => {
    if (!data?.heroes || searchQuery.trim() === '' || selectedLane === 'All') return [];
    const poolMatches = filterHeroesBySearch(data.heroes, searchQuery);
    const visibleIds = new Set(filteredHeroes.map((h) => h.id));
    return poolMatches.filter((h) => !visibleIds.has(h.id));
  }, [data?.heroes, searchQuery, selectedLane, filteredHeroes]);

  const crossLaneLabel = useMemo(() => {
    const lanes = Array.from(new Set(crossLaneMatches.flatMap((h) => h.lanes)));
    return lanes.join(', ');
  }, [crossLaneMatches]);

  // When standard Tier mode is active, group visible heroes into S+ through D tiers
  const heroesByTier = useMemo(() => {
    const groups: Record<Tier, NormalizedHero[]> = {
      'S+': [],
      'S': [],
      'A': [],
      'B': [],
      'C': [],
      'D': [],
    };

    if (isBanPriority) return groups;

    for (const hero of filteredHeroes) {
      if (groups[hero.tier]) {
        groups[hero.tier].push(hero);
      }
    }

    // Sort descending by powerScore within each tier band
    for (const tier of ORDERED_TIERS) {
      groups[tier].sort((a, b) => b.powerScore - a.powerScore);
    }

    return groups;
  }, [filteredHeroes, isBanPriority]);

  return (
    <div className="min-h-screen bg-cyber-ground text-slate-100 flex flex-col w-full overflow-x-hidden font-sans">
      <Header
        updatedAt={data?.updatedAt}
        patchVersion={data?.patchVersion}
      />
      <DatasetControls
        rankTier={rankTier}
        onRankTierChange={(nextRank) => {
          setRankTier(nextRank);
          syncUrlAndStorage(nextRank, timeWindow);
        }}
        timeWindow={timeWindow}
        onTimeWindowChange={(nextWindow) => {
          setTimeWindow(nextWindow);
          syncUrlAndStorage(rankTier, nextWindow);
        }}
        disabled={loading && !data}
      />
      <LaneCarousel
        selectedLane={selectedLane}
        onSelectLane={setSelectedLane}
        heroCounts={heroCounts}
      />

      <DraftControls
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isBanPriority={isBanPriority}
        onToggleBanPriority={() => setIsBanPriority((prev) => !prev)}
      />

      <main
        aria-busy={loading}
        className="flex-1 max-w-6xl w-full mx-auto px-2 sm:px-4 py-1.5 sm:py-3"
      >
        {/* Screen-reader announcement of result count */}
        <div aria-live="polite" role="status" className="sr-only">
          {data
            ? `${filteredHeroes.length} ${filteredHeroes.length === 1 ? 'hero' : 'heroes'} shown${isBanPriority ? ' in Ban Priority order' : ''}`
            : 'Loading hero tier list'}
        </div>
        {/* Initial full-page spinner only when no data is loaded yet */}
        {loading && !data && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono tracking-widest text-slate-400 uppercase">
              Loading Meta Telemetry...
            </p>
          </div>
        )}

        {/* Stale-data notice when switching datasets with cached data */}
        {loading && data && (
          <>
            <div
              data-testid="dataset-loading-bar"
              className="h-0.5 w-full bg-cyan-500/60 rounded-full mb-2"
            />
            <div className="flex justify-center mb-2">
              <span
                role="status"
                className="text-[11px] font-mono tabular-nums text-slate-400 bg-slate-900/80 border border-slate-800 px-2.5 py-1 rounded-full"
              >
                Updating to {RANK_LABEL[rankTier]} · {WINDOW_LABEL[timeWindow]}…
              </span>
            </div>
          </>
        )}

        {error && !loading && (
          <div className="my-8 p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-center">
            <h2 className="text-sm font-semibold text-red-400 mb-2">
              Failed to load tier list telemetry
            </h2>
            <p className="text-xs font-mono text-slate-400 mb-3">{error}</p>
            <button
              type="button"
              onClick={() => loadDataset(rankTier, timeWindow)}
              className="min-h-[44px] min-w-[44px] px-5 py-2 inline-flex items-center justify-center rounded-lg bg-red-800/60 hover:bg-red-700 text-xs font-semibold text-white border border-red-700 transition-colors active:scale-95"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty Search State */}
        {!error && data && filteredHeroes.length === 0 && searchQuery.trim() !== '' && (
          crossLaneMatches.length > 0 ? (
            <EmptyState
              testId="search-empty-state"
              icon="🔍"
              title={`No heroes found matching "${searchQuery.trim()}"`}
              description={`Matches found in ${crossLaneLabel} — show all lanes to draft them.`}
              actionLabel="Show All Lanes"
              onAction={() => setSelectedLane('All')}
            />
          ) : (
            <EmptyState
              testId="search-empty-state"
              icon="🔍"
              title={`No heroes found matching "${searchQuery.trim()}"`}
              description="Check for typos or reset your search query to restore visible heroes."
              actionLabel="Reset Search"
              onAction={() => setSearchQuery('')}
            />
          )
        )}

        {/* Empty Lane State (when search is empty but lane has no matching heroes) */}
        {!error && data && filteredHeroes.length === 0 && searchQuery.trim() === '' && (
          <EmptyState
            testId="lane-empty-state"
            icon="🛡️"
            title={`No heroes found in ${selectedLane}`}
            description="No heroes currently match the selected lane filter."
            actionLabel="Reset to All Lanes"
            onAction={() => setSelectedLane('All')}
          />
        )}

        {/* Ban Priority View */}
        {!error && data && filteredHeroes.length > 0 && isBanPriority && (
          <section
            aria-labelledby="ban-priority-heading"
            className={`relative mb-4 rounded-2xl border border-red-950/60 bg-slate-900/40 p-3 sm:p-4 transition-opacity ${loading ? 'opacity-60 saturate-50 pointer-events-none' : ''}`}
          >
            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <span
                  id="ban-priority-heading"
                  className="px-2 py-0.5 rounded-md text-xs font-bold tracking-wider uppercase bg-red-950/60 border border-red-500/30 text-rose-300"
                >
                  BAN
                </span>
                <span className="text-xs sm:text-sm font-medium text-slate-300">
                  Ban Priority · Highest Ban Rate
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400 bg-slate-950/60 px-2.5 py-0.5 rounded-full border border-slate-800">
                {banSortedHeroes.length} {banSortedHeroes.length === 1 ? 'Hero' : 'Heroes'}
              </span>
            </div>
            <div
              data-testid="ban-priority-grid"
              className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1.5 sm:gap-2"
            >
              {banSortedHeroes.map((hero) => (
                <HeroTile
                  key={hero.id}
                  hero={hero}
                  metric="banRate"
                  showTierChip
                  onSelect={handleSelectHero}
                />
              ))}
            </div>
          </section>
        )}

        {/* Standard Tier Bands View */}
        {!error && data && filteredHeroes.length > 0 && !isBanPriority && (
          <div
            className={`space-y-0 transition-opacity ${loading ? 'opacity-60 saturate-50 pointer-events-none' : ''}`}
          >
            {ORDERED_TIERS.map((tier) =>
              heroesByTier[tier].length > 0 ? (
                <TierSection
                  key={tier}
                  tier={tier}
                  heroes={heroesByTier[tier]}
                  onSelectHero={handleSelectHero}
                />
              ) : (
                <div key={tier}>
                  <EmptyTierRow
                    tier={tier}
                    expanded={expandedEmptyTiers[tier]}
                    onToggle={() => toggleEmptyTier(tier)}
                  />
                  {expandedEmptyTiers[tier] && (
                    <TierSection
                      tier={tier}
                      heroes={[]}
                      onSelectHero={handleSelectHero}
                    />
                  )}
                </div>
              )
            )}
          </div>
        )}
      </main>

      {/* Hero Detail Bottom Sheet Drawer */}
      {selectedHero && (
        <HeroDetailDrawer
          hero={selectedHero}
          heroPool={data?.heroes}
          onClose={() => setSelectedHero(null)}
          onSelectPartner={(partnerHeroId) => {
            const partner = data?.heroes.find((h) => h.id === partnerHeroId);
            if (partner) {
              setSelectedHero(partner);
              onSelectHero?.(partner);
            }
          }}
        />
      )}
    </div>
  );
};
