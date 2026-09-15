import React, { useState, useEffect, useMemo } from 'react';
import type { Tier, TierListDataset, NormalizedHero, LaneFilter } from '../types/index.ts';
import { Header } from './Header.tsx';
import { LaneCarousel } from './LaneCarousel.tsx';
import { TierSection } from './TierSection.tsx';
import { filterHeroesByLane, calculateLaneCounts } from '../utils/laneFilter.ts';

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

  const heroesByTier = useMemo(() => {
    const groups: Record<Tier, NormalizedHero[]> = {
      'S+': [],
      'S': [],
      'A': [],
      'B': [],
      'C': [],
      'D': [],
    };

    if (!data?.heroes) return groups;

    const filtered = filterHeroesByLane(data.heroes, selectedLane);

    for (const hero of filtered) {
      if (groups[hero.tier]) {
        groups[hero.tier].push(hero);
      }
    }

    // Sort descending by powerScore within each tier band
    for (const tier of ORDERED_TIERS) {
      groups[tier].sort((a, b) => b.powerScore - a.powerScore);
    }

    return groups;
  }, [data?.heroes, selectedLane]);

  const totalFilteredHeroes = useMemo(() => {
    return ORDERED_TIERS.reduce((acc, tier) => acc + heroesByTier[tier].length, 0);
  }, [heroesByTier]);

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

      <main className="flex-1 max-w-5xl w-full mx-auto px-2 sm:px-4 py-3 sm:py-5">
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

        {!loading && !error && data && totalFilteredHeroes === 0 && (
          <div
            data-testid="lane-empty-state"
            className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl bg-cyber-card/40 border border-cyber-border my-4"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-800/80 flex items-center justify-center mb-3 text-slate-400">
              <span className="text-xl">🛡️</span>
            </div>
            <h2 className="text-sm font-bold text-slate-200 mb-1">
              No heroes found in {selectedLane}
            </h2>
            <p className="text-xs text-slate-400 mb-4 max-w-xs">
              No heroes currently match the selected lane filter.
            </p>
            <button
              type="button"
              onClick={() => setSelectedLane('All')}
              className="min-h-[44px] min-w-[44px] px-4 py-2 inline-flex items-center justify-center rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-xs font-semibold text-cyan-300 hover:bg-cyan-900/60 transition-colors active:scale-95"
            >
              Reset to All Lanes
            </button>
          </div>
        )}

        {!loading && !error && data && totalFilteredHeroes > 0 && (
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

