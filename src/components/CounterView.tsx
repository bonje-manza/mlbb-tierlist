import React, { useState, useMemo } from 'react';
import type { NormalizedHero, CounterMatchup, CounterStrength, Lane, Role } from '../types/index.ts';
import { EmptyState } from './EmptyState.tsx';

export interface CounterViewProps {
  heroes: NormalizedHero[];
  selectedHeroId?: number;
  onSelectTargetHero?: (hero: NormalizedHero) => void;
  onViewHeroDetail?: (hero: NormalizedHero) => void;
}

const STRENGTH_STYLES: Record<CounterStrength, { badge: string; border: string; text: string }> = {
  'Very Strong': {
    badge: 'bg-rose-950/50 text-rose-300 border-rose-800/80',
    border: 'border-rose-600/60',
    text: 'text-rose-400'
  },
  'Strong': {
    badge: 'bg-indigo-950/50 text-indigo-300 border-indigo-800/80',
    border: 'border-indigo-600/60',
    text: 'text-indigo-400'
  },
  'Moderate': {
    badge: 'bg-cyan-950/50 text-cyan-300 border-cyan-800/80',
    border: 'border-cyan-600/60',
    text: 'text-cyan-400'
  },
  'Slight': {
    badge: 'bg-zinc-800/70 text-zinc-300 border-zinc-700/80',
    border: 'border-zinc-700/60',
    text: 'text-zinc-400'
  }
};

const ALL_LANES: Array<Lane | 'All'> = ['All', 'Gold Lane', 'EXP Lane', 'Mid Lane', 'Roam', 'Jungle'];
const ALL_ROLES: Array<Role | 'All'> = ['All', 'Tank', 'Fighter', 'Assassin', 'Mage', 'Marksman', 'Support'];

export const CounterView: React.FC<CounterViewProps> = ({
  heroes,
  selectedHeroId,
  onSelectTargetHero,
  onViewHeroDetail
}) => {
  // Currently targeted enemy hero
  const [targetId, setTargetId] = useState<number>(() => {
    if (selectedHeroId && heroes.some(h => h.id === selectedHeroId)) {
      return selectedHeroId;
    }
    return heroes[0]?.id ?? 1;
  });

  const [heroSearch, setHeroSearch] = useState<string>('');
  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);
  const [selectedLane, setSelectedLane] = useState<Lane | 'All'>('All');
  const [selectedRole, setSelectedRole] = useState<Role | 'All'>('All');
  const [avatarErrors, setAvatarErrors] = useState<Record<number, boolean>>({});

  const targetHero = useMemo(() => {
    return heroes.find(h => h.id === targetId) || heroes[0] || null;
  }, [heroes, targetId]);

  // All viable counters from target hero's dataset
  const allCounters = useMemo<CounterMatchup[]>(() => {
    if (!targetHero || !targetHero.counters) return [];
    return targetHero.counters;
  }, [targetHero]);

  // Filter counters by Lane and Role
  const filteredCounters = useMemo(() => {
    return allCounters.filter(counter => {
      const matchLane = selectedLane === 'All' || counter.lanes.includes(selectedLane);
      const matchRole = selectedRole === 'All' || counter.roles.includes(selectedRole);
      return matchLane && matchRole;
    });
  }, [allCounters, selectedLane, selectedRole]);

  // Counter counts per lane
  const laneCounts = useMemo(() => {
    const counts: Record<string, number> = { All: allCounters.length };
    for (const lane of ALL_LANES) {
      if (lane === 'All') continue;
      counts[lane] = allCounters.filter(c => c.lanes.includes(lane)).length;
    }
    return counts;
  }, [allCounters]);

  // Filtered hero search in target picker
  const pickerHeroes = useMemo(() => {
    if (!heroSearch.trim()) return heroes;
    const q = heroSearch.toLowerCase().trim();
    return heroes.filter(h => h.name.toLowerCase().includes(q));
  }, [heroes, heroSearch]);

  const handleSelectTarget = (hero: NormalizedHero) => {
    setTargetId(hero.id);
    setIsPickerOpen(false);
    setHeroSearch('');
    onSelectTargetHero?.(hero);
  };

  return (
    <div data-testid="counters-container" className="flex flex-col gap-5 max-w-7xl mx-auto w-full">
      {/* Target Hero Selector Banner */}
      <div className="rounded-xl bg-cyber-card border border-cyber-border p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Target Hero Card Info */}
          <div className="flex items-center gap-3.5 sm:gap-4">
            {targetHero && (
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-black border-2 border-zinc-700 shrink-0 shadow-md">
                {!avatarErrors[targetHero.id] ? (
                  <img
                    src={targetHero.avatarUrl}
                    alt={targetHero.name}
                    className="w-full h-full object-cover"
                    onError={() => setAvatarErrors(prev => ({ ...prev, [targetHero.id]: true }))}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-xs font-mono font-medium text-zinc-400">
                    {targetHero.name.slice(0, 3)}
                  </div>
                )}
                <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[10px] font-mono text-center py-0.5 text-zinc-300">
                  {targetHero.tier} TIER
                </span>
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono uppercase tracking-wider text-rose-400 font-semibold">
                  Enemy Target Hero
                </span>
                <span className="text-xs text-zinc-600">·</span>
                <span className="text-xs font-mono text-zinc-400">
                  {(targetHero?.winRate ? targetHero.winRate * 100 : 50).toFixed(1)}% WR
                </span>
              </div>
              <h2
                data-testid="target-hero-title"
                className="text-xl sm:text-2xl font-bold text-white tracking-tight"
              >
                {targetHero ? targetHero.name : 'Select Hero'}
              </h2>
              <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
                {targetHero?.roles && targetHero.roles.length > 0 && (
                  <span>{targetHero.roles.join(' / ')}</span>
                )}
                {targetHero?.lanes && targetHero.lanes.length > 0 && (
                  <>
                    <span className="text-zinc-600">·</span>
                    <span className="text-zinc-300">{targetHero.lanes.join(', ')}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Change Target Hero Button */}
          <div className="w-full sm:w-auto relative">
            <button
              type="button"
              data-testid="change-target-hero-btn"
              onClick={() => setIsPickerOpen(prev => !prev)}
              className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-lg bg-cyber-hover hover:bg-zinc-800 border border-zinc-700 text-xs sm:text-sm font-medium text-zinc-200 hover:text-white flex items-center justify-center gap-2 transition-colors active:scale-95 cursor-pointer shadow-xs"
            >
              <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>{isPickerOpen ? 'Close Hero Selector' : 'Change Target Hero'}</span>
            </button>
          </div>
        </div>

        {/* Hero Selector Popover */}
        {isPickerOpen && (
          <div
            data-testid="hero-picker-panel"
            className="mt-4 pt-4 border-t border-cyber-border animate-fadeIn"
          >
            <div className="mb-3">
              <input
                type="text"
                data-testid="hero-picker-search"
                value={heroSearch}
                onChange={e => setHeroSearch(e.target.value)}
                placeholder="Search heroes to counter (e.g. Miya, Cici, Fanny)..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-black/60 border border-zinc-700 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-zinc-500"
                autoFocus
              />
            </div>

            <div className="max-h-60 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 p-1">
              {pickerHeroes.map(hero => (
                <button
                  key={hero.id}
                  type="button"
                  data-testid={`picker-hero-${hero.id}`}
                  onClick={() => handleSelectTarget(hero)}
                  className={`min-h-[44px] flex items-center gap-2 p-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                    hero.id === targetId
                      ? 'bg-zinc-800 border-zinc-500 text-white'
                      : 'bg-zinc-900/50 hover:bg-zinc-800 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                  }`}
                >
                  <div className="w-8 h-8 rounded-md overflow-hidden bg-black shrink-0">
                    <img src={hero.avatarUrl} alt={hero.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs font-medium truncate">{hero.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filters: Lane & Role Bar */}
      <div className="flex flex-col gap-3">
        {/* Lane Tabs Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-xs font-mono text-zinc-500 uppercase shrink-0 mr-1 hidden sm:inline">
            Lane:
          </span>
          {ALL_LANES.map(lane => {
            const count = laneCounts[lane] ?? 0;
            const active = selectedLane === lane;
            return (
              <button
                key={lane}
                type="button"
                data-testid={`counter-lane-tab-${lane.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => setSelectedLane(lane)}
                className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-2 shrink-0 transition-all cursor-pointer active:scale-95 ${
                  active
                    ? 'bg-zinc-200 text-black border-white shadow-xs font-semibold'
                    : 'bg-cyber-card hover:bg-cyber-hover text-zinc-400 hover:text-zinc-200 border-cyber-border'
                }`}
              >
                <span>{lane}</span>
                <span
                  className={`text-[11px] font-mono px-1.5 py-0.2 rounded-full ${
                    active ? 'bg-black/20 text-black' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Role Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-xs font-mono text-zinc-500 uppercase shrink-0 mr-1 hidden sm:inline">
            Role:
          </span>
          {ALL_ROLES.map(role => {
            const active = selectedRole === role;
            return (
              <button
                key={role}
                type="button"
                data-testid={`counter-role-tab-${role.toLowerCase()}`}
                onClick={() => setSelectedRole(role)}
                className={`min-h-[34px] px-3 py-1 rounded-md text-xs font-medium border shrink-0 transition-colors cursor-pointer ${
                  active
                    ? 'bg-zinc-700 text-white border-zinc-500'
                    : 'bg-black/40 hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 border-zinc-800/80'
                }`}
              >
                {role}
              </button>
            );
          })}
        </div>
      </div>

      {/* Counters Header & Viability Badge */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm sm:text-base font-semibold text-zinc-200">
            Viable Counter Picks
          </h3>
          <span
            data-testid="counter-count-badge"
            className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyber-hover border border-cyber-border text-zinc-300"
          >
            {filteredCounters.length} {filteredCounters.length === 1 ? 'counter' : 'counters'}
          </span>
        </div>

        <span className="text-xs font-mono text-emerald-400/90 hidden sm:inline">
          Threshold: ≥ 1.0% Win-Rate Shift
        </span>
      </div>

      {/* Counter Hero Tiles Grid */}
      {filteredCounters.length > 0 ? (
        <div
          data-testid="counters-grid"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
        >
          {filteredCounters.map((counter, idx) => {
            const styles = STRENGTH_STYLES[counter.strength] || STRENGTH_STYLES['Slight'];
            const fullHero = heroes.find(h => h.id === counter.heroId);

            return (
              <div
                key={counter.heroId}
                data-testid={`counter-card-${counter.heroId}`}
                onClick={() => fullHero && onViewHeroDetail?.(fullHero)}
                className="group relative rounded-xl bg-cyber-card hover:bg-cyber-hover border border-cyber-border hover:border-zinc-700 p-3 flex flex-col justify-between gap-2.5 transition-all shadow-xs cursor-pointer active:scale-98"
              >
                {/* Top Row: Rank & Strength Pill */}
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-mono font-bold text-zinc-500 group-hover:text-zinc-300">
                    #{idx + 1}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border uppercase tracking-wider ${styles.badge}`}
                  >
                    {counter.strength}
                  </span>
                </div>

                {/* Hero Avatar & Name */}
                <div className="flex items-center gap-3">
                  <div
                    className={`relative w-12 h-12 rounded-lg overflow-hidden bg-black border-2 ${styles.border} shrink-0 shadow-xs`}
                  >
                    {!avatarErrors[counter.heroId] ? (
                      <img
                        src={counter.avatarUrl}
                        alt={counter.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={() =>
                          setAvatarErrors(prev => ({ ...prev, [counter.heroId]: true }))
                        }
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-[10px] font-mono text-zinc-400">
                        {counter.name.slice(0, 3)}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-semibold text-zinc-100 group-hover:text-white truncate">
                      {counter.name}
                    </span>
                    <span
                      data-testid={`counter-advantage-${counter.heroId}`}
                      className="text-xs font-mono font-medium text-emerald-400"
                    >
                      {counter.advantageFormatted}
                    </span>
                  </div>
                </div>

                {/* Bottom Row: Lanes & Roles */}
                <div className="pt-2 border-t border-cyber-border/70 flex items-center justify-between text-[11px] text-zinc-400">
                  <span className="truncate">
                    {counter.lanes.length > 0 ? counter.lanes.join(', ') : counter.roles.join(', ')}
                  </span>
                  {fullHero && (
                    <span className="font-mono text-zinc-500 text-[10px] uppercase">
                      {fullHero.tier}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          testId="counters-empty-state"
          icon="🛡️"
          title={
            selectedLane !== 'All' || selectedRole !== 'All'
              ? `No viable ${selectedLane !== 'All' ? selectedLane : ''} ${selectedRole !== 'All' ? selectedRole : ''} counters found`
              : `No viable counters recorded for ${targetHero?.name || 'this hero'}`
          }
          description="Try resetting the lane or role filter to view all viable counter options."
          actionLabel="Show All Lanes & Roles"
          onAction={() => {
            setSelectedLane('All');
            setSelectedRole('All');
          }}
        />
      )}
    </div>
  );
};
