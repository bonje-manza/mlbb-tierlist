import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Tier, TierListDataset, NormalizedHero, LaneFilter, RankTier, TimeWindow } from '../types/index.ts';
import { Header } from './Header.tsx';
import { DatasetControls } from './DatasetControls.tsx';
import { LaneCarousel } from './LaneCarousel.tsx';
import { DraftControls } from './DraftControls.tsx';
import { TierSection } from './TierSection.tsx';
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

export const TierListDashboard: React.FC<TierListDashboardProps> = ({
  dataset: initialDataset,
  datasets,
  dataUrl = '/data/tierlist-mythic-1d.json',
  onSelectHero,
}) => {
  const [rankTier, setRankTier] = useState<RankTier>(
    initialDataset?.rankTier || 'mythic'
  );
  const [timeWindow, setTimeWindow] = useState<TimeWindow>(
    initialDataset?.timeWindow || '1d'
  );

  const initialKey = getDatasetKey(
    initialDataset?.rankTier || 'mythic',
    initialDataset?.timeWindow || '1d'
  );

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
        onRankTierChange={(nextRank) => setRankTier(nextRank)}
        timeWindow={timeWindow}
        onTimeWindowChange={(nextWindow) => setTimeWindow(nextWindow)}
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

      <main className="flex-1 max-w-5xl w-full mx-auto px-2 sm:px-4 py-2 sm:py-4">
        {/* Initial full-page spinner only when no data is loaded yet */}
        {loading && !data && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono tracking-widest text-slate-400 uppercase">
              Loading Meta Telemetry...
            </p>
          </div>
        )}

        {/* Subtle loading bar when switching datasets with existing data (Zero Layout Jump) */}
        {loading && data && (
          <div
            data-testid="dataset-loading-bar"
            className="h-1 w-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 animate-pulse rounded-full mb-3"
          />
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
          <EmptyState
            testId="search-empty-state"
            icon="🔍"
            title={`No heroes found matching "${searchQuery.trim()}"`}
            description="Check for typos or reset your search query to restore visible heroes."
            actionLabel="Reset Search"
            onAction={() => setSearchQuery('')}
          />
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
            className="relative mb-4 rounded-xl border border-rose-500/40 bg-gradient-to-b from-rose-500/10 to-cyber-card/60 p-2.5 sm:p-3.5 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span
                  id="ban-priority-heading"
                  className="px-2 py-0.5 rounded text-xs font-black tracking-wider uppercase bg-rose-600 text-white shadow-lg shadow-rose-600/30"
                >
                  BAN
                </span>
                <span className="text-xs sm:text-sm font-semibold text-slate-200">
                  Ranked Ban Priority (Highest Ban Rate)
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded-full border border-slate-800">
                {banSortedHeroes.length} {banSortedHeroes.length === 1 ? 'Hero' : 'Heroes'}
              </span>
            </div>
            <div
              data-testid="ban-priority-grid"
              className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5"
            >
              {banSortedHeroes.map((hero) => (
                <HeroTile key={hero.id} hero={hero} onSelect={handleSelectHero} />
              ))}
            </div>
          </section>
        )}

        {/* Standard Tier Bands View */}
        {!error && data && filteredHeroes.length > 0 && !isBanPriority && (
          <div className="space-y-4">
            {ORDERED_TIERS.map((tier) => (
              <TierSection
                key={tier}
                tier={tier}
                heroes={heroesByTier[tier]}
                onSelectHero={handleSelectHero}
              />
            ))}
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
