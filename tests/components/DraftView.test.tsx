import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { DraftView } from '../../src/components/DraftView.tsx';
import type { NormalizedHero } from '../../src/types/index.ts';

const mockHeroes: NormalizedHero[] = [
  {
    id: 1,
    name: 'Miya',
    avatarUrl: 'https://cdn/miya.png',
    roles: ['Marksman'],
    lanes: ['Gold Lane'],
    winRate: 0.52,
    pickRate: 0.03,
    banRate: 0.01,
    powerScore: 68.0,
    tier: 'A',
    synergies: [],
    counters: [
      {
        heroId: 2,
        name: 'Chou',
        avatarUrl: '',
        roles: ['Fighter'],
        lanes: ['EXP Lane', 'Roam'],
        winRateDelta: 0.045, // Chou counters Miya by 4.5% (Fatal > 3.5%)
        advantageFormatted: '+4.5% WR',
        strength: 'Strong',
      },
    ],
  },
  {
    id: 2,
    name: 'Chou',
    avatarUrl: 'https://cdn/chou.png',
    roles: ['Fighter'],
    lanes: ['EXP Lane', 'Roam'],
    winRate: 0.54,
    pickRate: 0.04,
    banRate: 0.05,
    powerScore: 74.0,
    tier: 'A',
    synergies: [],
    counters: [],
  },
  {
    id: 3,
    name: 'Pharsa',
    avatarUrl: 'https://cdn/pharsa.png',
    roles: ['Mage'],
    lanes: ['Mid Lane'],
    winRate: 0.55,
    pickRate: 0.03,
    banRate: 0.08,
    powerScore: 78.0,
    tier: 'S',
    synergies: [],
    counters: [],
  },
  {
    id: 4,
    name: 'Tigreal',
    avatarUrl: 'https://cdn/tigreal.png',
    roles: ['Tank'],
    lanes: ['Roam'],
    winRate: 0.51,
    pickRate: 0.05,
    banRate: 0.1,
    powerScore: 72.0,
    tier: 'A',
    synergies: [],
    counters: [],
  },
];

describe('DraftView Component', () => {
  it('renders drafting rosters, empty slots, and recommendations', () => {
    render(
      <DraftView
        heroes={mockHeroes}
        enemyHeroIds={[]}
        allyHeroIds={[]}
        onAddEnemyHero={vi.fn()}
        onRemoveEnemyHero={vi.fn()}
        onAddAllyHero={vi.fn()}
        onRemoveAllyHero={vi.fn()}
        onResetDraft={vi.fn()}
      />
    );

    expect(screen.getByTestId('draft-assistant-container')).toBeInTheDocument();
    expect(screen.getByTestId('empty-enemy-slot-0')).toBeInTheDocument();
    expect(screen.getByTestId('empty-ally-slot-0')).toBeInTheDocument();
    expect(screen.getByTestId('recommendations-list')).toBeInTheDocument();
    expect(screen.getByText('Miya')).toBeInTheDocument();
  });

  it('allows opening hero picker and selecting enemy hero', () => {
    const onAddEnemyHero = vi.fn();
    render(
      <DraftView
        heroes={mockHeroes}
        enemyHeroIds={[]}
        allyHeroIds={[]}
        onAddEnemyHero={onAddEnemyHero}
        onRemoveEnemyHero={vi.fn()}
        onAddAllyHero={vi.fn()}
        onRemoveAllyHero={vi.fn()}
        onResetDraft={vi.fn()}
      />
    );

    // Click + Add Enemy Pick
    fireEvent.click(screen.getByTestId('add-enemy-pick-btn'));
    expect(screen.getByTestId('draft-picker-modal')).toBeInTheDocument();

    // Select Chou
    fireEvent.click(screen.getByTestId('draft-pick-candidate-2'));
    expect(onAddEnemyHero).toHaveBeenCalledWith(2);
  });

  it('displays filled enemy and ally slots with remove buttons', () => {
    const onRemoveEnemyHero = vi.fn();
    const onRemoveAllyHero = vi.fn();
    render(
      <DraftView
        heroes={mockHeroes}
        enemyHeroIds={[2]} // Chou
        allyHeroIds={[4]} // Tigreal
        onAddEnemyHero={vi.fn()}
        onRemoveEnemyHero={onRemoveEnemyHero}
        onAddAllyHero={vi.fn()}
        onRemoveAllyHero={onRemoveAllyHero}
        onResetDraft={vi.fn()}
      />
    );

    expect(screen.getByTestId('enemy-slot-2')).toBeInTheDocument();
    expect(screen.getByTestId('ally-slot-4')).toBeInTheDocument();

    // Remove enemy pick
    fireEvent.click(screen.getByTestId('remove-enemy-2'));
    expect(onRemoveEnemyHero).toHaveBeenCalledWith(2);

    // Remove ally pick
    fireEvent.click(screen.getByTestId('remove-ally-4'));
    expect(onRemoveAllyHero).toHaveBeenCalledWith(4);
  });

  it('triggers Kryptonite warning on Miya when enemy has locked Chou', () => {
    render(
      <DraftView
        heroes={mockHeroes}
        enemyHeroIds={[2]} // Chou counters Miya by 4.5%
        allyHeroIds={[]}
        onAddEnemyHero={vi.fn()}
        onRemoveEnemyHero={vi.fn()}
        onAddAllyHero={vi.fn()}
        onRemoveAllyHero={vi.fn()}
        onResetDraft={vi.fn()}
      />
    );

    // Miya should display a kryptonite alert
    expect(screen.getByTestId('kryptonite-alert-1')).toBeInTheDocument();
    expect(screen.getByText(/Hard countered by Chou/)).toBeInTheDocument();
  });

  it('filters recommendations by lane tabs', () => {
    render(
      <DraftView
        heroes={mockHeroes}
        enemyHeroIds={[]}
        allyHeroIds={[]}
        onAddEnemyHero={vi.fn()}
        onRemoveEnemyHero={vi.fn()}
        onAddAllyHero={vi.fn()}
        onRemoveAllyHero={vi.fn()}
        onResetDraft={vi.fn()}
      />
    );

    // Click Mid lane filter
    fireEvent.click(screen.getByTestId('draft-lane-Mid'));
    expect(screen.getByText('Pharsa')).toBeInTheDocument();
    expect(screen.queryByText('Miya')).not.toBeInTheDocument();
  });

  it('triggers onResetDraft when clicking reset button', () => {
    const onResetDraft = vi.fn();
    render(
      <DraftView
        heroes={mockHeroes}
        enemyHeroIds={[1]}
        allyHeroIds={[]}
        onAddEnemyHero={vi.fn()}
        onRemoveEnemyHero={vi.fn()}
        onAddAllyHero={vi.fn()}
        onRemoveAllyHero={vi.fn()}
        onResetDraft={onResetDraft}
      />
    );

    fireEvent.click(screen.getByTestId('reset-draft-btn'));
    expect(onResetDraft).toHaveBeenCalled();
  });
});
