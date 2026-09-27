import React, { useState, useMemo } from 'react';
import type {
  NormalizedHero,
  LaneFilter,
  Lane,
  PowerScoreWeights,
} from '../types/index.ts';
import { inferPrimaryLane, evaluateCompositionHygiene } from '../utils/draftHygiene.ts';
import { rankDraftRecommendations } from '../utils/draftEngine.ts';
import { EmptyState } from './EmptyState.tsx';

export interface DraftViewProps {
  heroes: NormalizedHero[];
  enemyHeroIds: number[];
  allyHeroIds: number[];
  onAddEnemyHero: (heroId: number) => void;
  onRemoveEnemyHero: (heroId: number) => void;
  onAddAllyHero: (heroId: number) => void;
  onRemoveAllyHero: (heroId: number) => void;
  onResetDraft: () => void;
  onSelectHeroDetail?: (hero: NormalizedHero) => void;
  customWeights?: PowerScoreWeights;
}

const ALL_LANES: Array<LaneFilter> = ['All', 'Gold', 'EXP', 'Mid', 'Roam', 'Jungle'];

export const DraftView: React.FC<DraftViewProps> = ({
  heroes,
  enemyHeroIds,
  allyHeroIds,
  onAddEnemyHero,
  onRemoveEnemyHero,
  onAddAllyHero,
  onRemoveAllyHero,
  onResetDraft,
  onSelectHeroDetail,
  customWeights,
}) => {
  const [selectedLane, setSelectedLane] = useState<LaneFilter>('All');
  const [pickerTarget, setPickerTarget] = useState<'enemy' | 'ally' | null>(null);
  const [pickerSearch, setPickerSearch] = useState<string>('');
  const [avatarErrors, setAvatarErrors] = useState<Record<number, boolean>>({});

  // Resolve hero objects from IDs
  const enemyHeroes = useMemo(() => {
    return enemyHeroIds
      .map((id) => heroes.find((h) => h.id === id))
      .filter((h): h is NormalizedHero => Boolean(h));
  }, [enemyHeroIds, heroes]);

  const allyHeroes = useMemo(() => {
    return allyHeroIds
      .map((id) => heroes.find((h) => h.id === id))
      .filter((h): h is NormalizedHero => Boolean(h));
  }, [allyHeroIds, heroes]);

  const lockedHeroIds = useMemo(() => {
    return new Set<number>([...enemyHeroIds, ...allyHeroIds]);
  }, [enemyHeroIds, allyHeroIds]);

  // Composition hygiene evaluation for Allied team
  const allyHygiene = useMemo(() => {
    return evaluateCompositionHygiene(allyHeroes);
  }, [allyHeroes]);

  // Recommendations calculated via DraftEngine
  const recommendations = useMemo(() => {
    return rankDraftRecommendations(
      heroes,
      enemyHeroes,
      allyHeroes,
      selectedLane,
      { customWeights }
    );
  }, [heroes, enemyHeroes, allyHeroes, selectedLane, customWeights]);

  // Recommendation counts per lane
  const laneCounts = useMemo(() => {
    const counts: Record<LaneFilter, number> = {
      All: 0,
      Gold: 0,
      EXP: 0,
      Mid: 0,
      Roam: 0,
      Jungle: 0,
    };

    const allRecs = rankDraftRecommendations(
      heroes,
      enemyHeroes,
      allyHeroes,
      'All',
      { customWeights }
    );
    counts.All = allRecs.length;

    const laneMap: Record<LaneFilter, Lane | null> = {
      All: null,
      Gold: 'Gold Lane',
      EXP: 'EXP Lane',
      Mid: 'Mid Lane',
      Roam: 'Roam',
      Jungle: 'Jungle',
    };

    for (const laneKey of ALL_LANES) {
      if (laneKey === 'All') continue;
      const targetCanonical = laneMap[laneKey];
      counts[laneKey] = allRecs.filter(
        (r) => targetCanonical && r.hero.lanes.includes(targetCanonical)
      ).length;
    }

    return counts;
  }, [heroes, enemyHeroes, allyHeroes, customWeights]);

  // Search filter inside picker modal
  const pickerHeroes = useMemo(() => {
    const available = heroes.filter((h) => !lockedHeroIds.has(h.id));
    if (!pickerSearch.trim()) return available;
    const q = pickerSearch.toLowerCase().trim();
    return available.filter((h) => h.name.toLowerCase().includes(q));
  }, [heroes, lockedHeroIds, pickerSearch]);

  const handleSelectPickerHero = (heroId: number) => {
    if (pickerTarget === 'enemy') {
      onAddEnemyHero(heroId);
    } else if (pickerTarget === 'ally') {
      onAddAllyHero(heroId);
    }
    setPickerTarget(null);
    setPickerSearch('');
  };

  const getCdrBadgeStyle = (cdr: number) => {
    if (cdr >= 85) {
      return 'bg-purple-950/70 text-purple-300 border-purple-500/80 shadow-xs shadow-purple-500/20';
    }
    if (cdr >= 75) {
      return 'bg-cyan-950/70 text-cyan-300 border-cyan-500/80';
    }
    if (cdr >= 60) {
      return 'bg-emerald-950/70 text-emerald-300 border-emerald-500/80';
    }
    if (cdr >= 45) {
      return 'bg-zinc-800/80 text-zinc-300 border-zinc-600/80';
    }
    return 'bg-amber-950/70 text-amber-400 border-amber-600/80';
  };

  return (
    <div data-testid="draft-assistant-container" className="flex flex-col gap-5 max-w-7xl mx-auto w-full">
      {/* Drafting Rosters Board */}
      <div className="rounded-xl bg-cyber-card border border-cyber-border p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-cyber-border">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Live Draft Assistant
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Multi-Hero Composite Draft Rating (CDR) with Kryptonite Hard-Counter Shielding
            </p>
          </div>

          {(enemyHeroIds.length > 0 || allyHeroIds.length > 0) && (
            <button
              type="button"
              data-testid="reset-draft-btn"
              onClick={onResetDraft}
              className="px-3 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700 text-xs font-medium text-zinc-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Reset Draft</span>
            </button>
          )}
        </div>

        {/* Rosters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Enemy Roster */}
          <div className="flex flex-col gap-2 bg-rose-950/10 border border-rose-900/30 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                Enemy Team ({enemyHeroes.length}/5)
              </span>
              {enemyHeroes.length < 5 && (
                <button
                  type="button"
                  data-testid="add-enemy-pick-btn"
                  onClick={() => setPickerTarget('enemy')}
                  className="text-xs px-2.5 py-1 rounded bg-rose-900/40 hover:bg-rose-900/60 border border-rose-700/60 text-rose-300 font-medium cursor-pointer transition-colors"
                >
                  + Add Enemy Pick
                </button>
              )}
            </div>

            <div className="grid grid-cols-5 gap-2 mt-1">
              {[0, 1, 2, 3, 4].map((idx) => {
                const hero = enemyHeroes[idx];
                if (hero) {
                  return (
                    <div
                      key={hero.id}
                      data-testid={`enemy-slot-${hero.id}`}
                      className="relative flex flex-col items-center bg-black/60 border border-rose-700/60 rounded-lg p-1 group"
                    >
                      <button
                        type="button"
                        data-testid={`remove-enemy-${hero.id}`}
                        onClick={() => onRemoveEnemyHero(hero.id)}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold cursor-pointer shadow-xs z-10"
                        title={`Remove ${hero.name}`}
                      >
                        ✕
                      </button>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-md overflow-hidden bg-zinc-900 shrink-0">
                        {!avatarErrors[hero.id] ? (
                          <img
                            src={hero.avatarUrl}
                            alt={hero.name}
                            className="w-full h-full object-cover"
                            onError={() => setAvatarErrors((prev) => ({ ...prev, [hero.id]: true }))}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-mono text-zinc-400">
                            {hero.name.slice(0, 2)}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-medium text-zinc-200 truncate w-full text-center mt-1">
                        {hero.name}
                      </span>
                      <span className="text-[8px] font-mono text-rose-300 truncate">
                        {inferPrimaryLane(hero).replace(' Lane', '')}
                      </span>
                    </div>
                  );
                }

                return (
                  <button
                    key={`empty-enemy-${idx}`}
                    type="button"
                    onClick={() => setPickerTarget('enemy')}
                    data-testid={`empty-enemy-slot-${idx}`}
                    className="h-16 sm:h-20 border border-dashed border-rose-800/40 hover:border-rose-600/70 rounded-lg flex flex-col items-center justify-center gap-1 text-rose-500/60 hover:text-rose-400 cursor-pointer transition-colors bg-black/20"
                  >
                    <span className="text-base sm:text-lg font-light">+</span>
                    <span className="text-[9px] font-mono uppercase">Slot {idx + 1}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Allied Roster */}
          <div className="flex flex-col gap-2 bg-indigo-950/10 border border-indigo-900/30 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                Allied Team ({allyHeroes.length}/4)
              </span>
              {allyHeroes.length < 4 && (
                <button
                  type="button"
                  data-testid="add-ally-pick-btn"
                  onClick={() => setPickerTarget('ally')}
                  className="text-xs px-2.5 py-1 rounded bg-indigo-900/40 hover:bg-indigo-900/60 border border-indigo-700/60 text-indigo-300 font-medium cursor-pointer transition-colors"
                >
                  + Add Ally Pick
                </button>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2 mt-1">
              {[0, 1, 2, 3].map((idx) => {
                const hero = allyHeroes[idx];
                if (hero) {
                  return (
                    <div
                      key={hero.id}
                      data-testid={`ally-slot-${hero.id}`}
                      className="relative flex flex-col items-center bg-black/60 border border-indigo-700/60 rounded-lg p-1 group"
                    >
                      <button
                        type="button"
                        data-testid={`remove-ally-${hero.id}`}
                        onClick={() => onRemoveAllyHero(hero.id)}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center text-[10px] font-bold cursor-pointer shadow-xs z-10"
                        title={`Remove ${hero.name}`}
                      >
                        ✕
                      </button>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-md overflow-hidden bg-zinc-900 shrink-0">
                        {!avatarErrors[hero.id] ? (
                          <img
                            src={hero.avatarUrl}
                            alt={hero.name}
                            className="w-full h-full object-cover"
                            onError={() => setAvatarErrors((prev) => ({ ...prev, [hero.id]: true }))}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-mono text-zinc-400">
                            {hero.name.slice(0, 2)}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-medium text-zinc-200 truncate w-full text-center mt-1">
                        {hero.name}
                      </span>
                      <span className="text-[8px] font-mono text-indigo-300 truncate">
                        {inferPrimaryLane(hero).replace(' Lane', '')}
                      </span>
                    </div>
                  );
                }

                return (
                  <button
                    key={`empty-ally-${idx}`}
                    type="button"
                    onClick={() => setPickerTarget('ally')}
                    data-testid={`empty-ally-slot-${idx}`}
                    className="h-16 sm:h-20 border border-dashed border-indigo-800/40 hover:border-indigo-600/70 rounded-lg flex flex-col items-center justify-center gap-1 text-indigo-500/60 hover:text-indigo-400 cursor-pointer transition-colors bg-black/20"
                  >
                    <span className="text-base sm:text-lg font-light">+</span>
                    <span className="text-[9px] font-mono uppercase">Slot {idx + 1}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Team Hygiene Diagnostic Badges */}
        {allyHeroes.length > 0 && allyHygiene.diagnostics.length > 0 && (
          <div data-testid="draft-hygiene-bar" className="mt-3 pt-3 border-t border-cyber-border flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
              Composition Audit:
            </span>
            {allyHygiene.diagnostics.map((diag, i) => (
              <span
                key={i}
                className={`text-[11px] px-2 py-0.5 rounded border font-medium flex items-center gap-1 ${
                  diag.type === 'warning'
                    ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                    : diag.type === 'success'
                    ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                }`}
              >
                {diag.message}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Hero Selection Popover Modal */}
      {pickerTarget && (
        <div data-testid="draft-picker-modal" className="rounded-xl bg-cyber-card border border-cyber-border p-4 shadow-md animate-fadeIn">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">
                Select Hero for {pickerTarget === 'enemy' ? 'Enemy Team' : 'Allied Team'}
              </span>
              <span className="text-xs font-mono text-zinc-400">
                ({pickerHeroes.length} available)
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setPickerTarget(null);
                setPickerSearch('');
              }}
              className="text-xs px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <input
            type="text"
            data-testid="draft-picker-search"
            value={pickerSearch}
            onChange={(e) => setPickerSearch(e.target.value)}
            placeholder="Search hero by name (e.g. Claude, Fanny, Tigreal)..."
            className="w-full px-3.5 py-2 rounded-lg bg-black/60 border border-zinc-700 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-zinc-500 mb-3"
            autoFocus
          />

          <div className="max-h-60 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 p-1">
            {pickerHeroes.map((hero) => (
              <button
                key={hero.id}
                type="button"
                data-testid={`draft-pick-candidate-${hero.id}`}
                onClick={() => handleSelectPickerHero(hero.id)}
                className="min-h-[44px] flex items-center gap-2 p-1.5 rounded-lg border border-zinc-800 hover:border-cyan-500/80 bg-zinc-900/60 hover:bg-zinc-800/80 text-left transition-all cursor-pointer"
              >
                <div className="w-7 h-7 rounded-md overflow-hidden bg-black shrink-0">
                  <img
                    src={hero.avatarUrl}
                    alt={hero.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-zinc-200 truncate">{hero.name}</div>
                  <div className="text-[10px] font-mono text-zinc-500 truncate">
                    {hero.lanes[0]?.replace(' Lane', '') || 'Flex'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lane Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {ALL_LANES.map((lane) => {
          const isSelected = selectedLane === lane;
          const count = laneCounts[lane];
          return (
            <button
              key={lane}
              type="button"
              data-testid={`draft-lane-${lane}`}
              onClick={() => setSelectedLane(lane)}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/60 shadow-xs'
                  : 'bg-zinc-900/60 hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              <span>{lane === 'All' ? 'All Roles' : lane}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-cyan-500/30 text-cyan-200' : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Recommendations Grid */}
      {recommendations.length > 0 ? (
        <div data-testid="recommendations-list" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {recommendations.slice(0, 30).map((rec) => {
            const { hero, cdr, counterAdvantage, synergyBonus, kryptonitePenalty, kryptoniteTarget } = rec;
            return (
              <div
                key={hero.id}
                data-testid={`recommendation-card-${hero.id}`}
                className="rounded-xl bg-cyber-card border border-cyber-border hover:border-zinc-700 p-3.5 flex flex-col justify-between gap-2.5 transition-colors shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-12 h-12 rounded-lg overflow-hidden bg-black border border-zinc-700 shrink-0 cursor-pointer"
                      onClick={() => onSelectHeroDetail?.(hero)}
                    >
                      <img
                        src={hero.avatarUrl}
                        alt={hero.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-sm font-bold text-white hover:text-cyan-300 cursor-pointer truncate"
                          onClick={() => onSelectHeroDetail?.(hero)}
                        >
                          {hero.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                          {hero.tier}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5 truncate">
                        {hero.lanes.join(', ')}
                      </div>
                    </div>
                  </div>

                  {/* CDR Score Badge */}
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500">
                      CDR Score
                    </span>
                    <span
                      data-testid={`cdr-score-${hero.id}`}
                      className={`text-sm font-mono font-bold px-2 py-0.5 rounded border ${getCdrBadgeStyle(
                        cdr
                      )}`}
                    >
                      {cdr.toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* Score Breakdown Chips */}
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                  <span
                    className={`px-1.5 py-0.5 rounded border ${
                      counterAdvantage > 0
                        ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                        : counterAdvantage < 0
                        ? 'bg-rose-950/40 text-rose-300 border-rose-800/60'
                        : 'bg-zinc-800/60 text-zinc-400 border-zinc-700/60'
                    }`}
                  >
                    Counter: {counterAdvantage > 0 ? `+${counterAdvantage.toFixed(1)}%` : `${counterAdvantage.toFixed(1)}%`}
                  </span>

                  {synergyBonus > 0 && (
                    <span className="px-1.5 py-0.5 rounded border bg-indigo-950/40 text-indigo-300 border-indigo-800/60">
                      Synergy: +{synergyBonus.toFixed(1)}%
                    </span>
                  )}

                  <span className="px-1.5 py-0.5 rounded border bg-zinc-900/60 text-zinc-400 border-zinc-800">
                    Base PS: {hero.powerScore.toFixed(1)}
                  </span>
                </div>

                {/* Kryptonite Fatal Counter Alert */}
                {kryptonitePenalty > 0 && (
                  <div
                    data-testid={`kryptonite-alert-${hero.id}`}
                    className="text-[10px] font-medium px-2 py-1 rounded bg-rose-950/80 border border-rose-700/80 text-rose-200 flex items-center gap-1"
                  >
                    <span>⚠️</span>
                    <span>Hard countered by {kryptoniteTarget} (-{kryptonitePenalty.toFixed(1)} pts)</span>
                  </div>
                )}

                {/* Quick Add to Allies Action */}
                {allyHeroIds.length < 4 && !lockedHeroIds.has(hero.id) && (
                  <button
                    type="button"
                    data-testid={`add-to-allies-btn-${hero.id}`}
                    onClick={() => onAddAllyHero(hero.id)}
                    className="w-full mt-1 py-1.5 rounded-lg bg-zinc-800/70 hover:bg-indigo-900/40 border border-zinc-700 hover:border-indigo-600/80 text-xs font-medium text-zinc-300 hover:text-indigo-200 transition-colors cursor-pointer text-center"
                  >
                    + Pick for Allied Team
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          testId="draft-empty-state"
          icon="🔍"
          title="No Matching Hero Recommendations"
          description="Try changing the active lane filter or adjusting team picks."
          actionLabel="Show All Roles"
          onAction={() => setSelectedLane('All')}
        />
      )}
    </div>
  );
};
