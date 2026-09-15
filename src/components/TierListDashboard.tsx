import React, { useState, useEffect, useMemo } from 'react';
import type { Tier, TierListDataset, NormalizedHero, LaneFilter } from '../types/index.ts';
import { Header } from './Header.tsx';
import { LaneCarousel } from './LaneCarousel.tsx';
import { DraftControls } from './DraftControls.tsx';
import { TierSection } from './TierSection.tsx';
import { HeroTile } from './HeroTile.tsx';
import { EmptyState } from './EmptyState.tsx';
import { filterHeroesByLane, calculateLaneCounts } from '../utils/laneFilter.ts';
import { filterHeroesBySearch, sortHeroesByBanRate } from '../utils/draftFilter.ts';

export interface TierListDashboardProps {
  dataset?: TierListDataset;
  dataUrl?: string;
  onSelectHero?: (hero: NormalizedHero) => void;
}

const ORDERED_TIERS: Tier[] = ['S+', 'S', 'A', 'B', 'C', 'D'];

export const TierListDashboard: React.FC<TierListDashboardProps> = ({
  dataset: initialDataset,
  dataUrl = '/data/tierlist-mythic-1d.json',
  onSelectHero,
}) => {
  const [data, setData] = useState<TierListDataset | null>(initialDataset || null);
  const [loading, setLoading] = useState<boolean>(!initialDataset);
  const [error, setError] = useState<string | null>(null);
  const [selectedLane, setSelectedLane] = useState<LaneFilter>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isBanPriority, setIsBanPriority] = useState<boolean>(false);

  const loadData = async (url: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to load tier list telemetry: HTTP ${res.status} ${res.statusText}`);
      }
      const json: TierListDataset = await res.json();
      setData(json);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load tier list telemetry';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialDataset) {
      setData(initialDataset);
      setLoading(false);
      setError(null);
      return;
    }
    loadData(dataUrl);
  }, [initialDataset, dataUrl]);

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
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono tracking-widest text-slate-400 uppercase">
              Loading Meta Telemetry...
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="my-8 p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-center">
            <h2 className="text-sm font-semibold text-red-400 mb-2">
              Failed to load tier list telemetry
            </h2>
            <p className="text-xs font-mono text-slate-400 mb-3">{error}</p>
            <button
              type="button"
              onClick={() => loadData(dataUrl)}
              className="min-h-[44px] min-w-[44px] px-5 py-2 inline-flex items-center justify-center rounded-lg bg-red-800/60 hover:bg-red-700 text-xs font-semibold text-white border border-red-700 transition-colors active:scale-95"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty Search State */}
        {!loading && !error && data && filteredHeroes.length === 0 && searchQuery.trim() !== '' && (
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
        {!loading && !error && data && filteredHeroes.length === 0 && searchQuery.trim() === '' && (
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
        {!loading && !error && data && filteredHeroes.length > 0 && isBanPriority && (
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
                <HeroTile key={hero.id} hero={hero} onSelect={onSelectHero} />
              ))}
            </div>
          </section>
        )}

        {/* Standard Tier Bands View */}
        {!loading && !error && data && filteredHeroes.length > 0 && !isBanPriority && (
          <div className="space-y-4">
            {ORDERED_TIERS.map((tier) => (
              <TierSection
                key={tier}
                tier={tier}
                heroes={heroesByTier[tier]}
                onSelectHero={onSelectHero}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
