import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CounterView } from '../../src/components/CounterView.tsx';
import type { NormalizedHero, CounterMatchup } from '../../src/types/index.ts';

const mockMiyaCounters: CounterMatchup[] = [
  {
    heroId: 104,
    name: 'Gloo',
    avatarUrl: 'https://cdn/gloo.png',
    roles: ['Tank'],
    lanes: ['EXP Lane'],
    winRateDelta: 0.065,
    advantageFormatted: '+6.5% WR',
    strength: 'Very Strong'
  },
  {
    heroId: 26,
    name: 'Chou',
    avatarUrl: 'https://cdn/chou.png',
    roles: ['Fighter'],
    lanes: ['EXP Lane', 'Roam'],
    winRateDelta: 0.038,
    advantageFormatted: '+3.8% WR',
    strength: 'Strong'
  },
  {
    heroId: 14,
    name: 'Rafaela',
    avatarUrl: 'https://cdn/rafaela.png',
    roles: ['Support'],
    lanes: ['Roam'],
    winRateDelta: 0.015,
    advantageFormatted: '+1.5% WR',
    strength: 'Slight'
  }
];

const mockMiya: NormalizedHero = {
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
  counters: mockMiyaCounters
};

const mockChou: NormalizedHero = {
  id: 26,
  name: 'Chou',
  avatarUrl: 'https://cdn/chou.png',
  roles: ['Fighter'],
  lanes: ['EXP Lane', 'Roam'],
  winRate: 0.51,
  pickRate: 0.02,
  banRate: 0.05,
  powerScore: 65.0,
  tier: 'B',
  synergies: [],
  counters: []
};

const mockHeroesPool: NormalizedHero[] = [mockMiya, mockChou];

describe('CounterView Component', () => {
  it('renders target hero details and all viable counters', () => {
    render(<CounterView heroes={mockHeroesPool} selectedHeroId={1} />);

    // Target hero title
    expect(screen.getByTestId('target-hero-title')).toHaveTextContent('Miya');

    // Counters count badge
    expect(screen.getByTestId('counter-count-badge')).toHaveTextContent('3 counters');

    // All 3 counters rendered in descending order
    expect(screen.getByText('Gloo')).toBeInTheDocument();
    expect(screen.getByText('+6.5% WR')).toBeInTheDocument();
    expect(screen.getByText(/very strong/i)).toBeInTheDocument();

    expect(screen.getByText('Chou')).toBeInTheDocument();
    expect(screen.getByText('+3.8% WR')).toBeInTheDocument();

    expect(screen.getByText('Rafaela')).toBeInTheDocument();
    expect(screen.getByText('+1.5% WR')).toBeInTheDocument();
  });

  it('filters viable counters by lane correctly', () => {
    render(<CounterView heroes={mockHeroesPool} selectedHeroId={1} />);

    // Click "Roam" lane tab
    const roamTab = screen.getByTestId('counter-lane-tab-roam');
    fireEvent.click(roamTab);

    // Roam counters: Chou (EXP + Roam) and Rafaela (Roam)
    expect(screen.getByText('Chou')).toBeInTheDocument();
    expect(screen.getByText('Rafaela')).toBeInTheDocument();
    // Gloo is EXP Lane only, so hidden under Roam
    expect(screen.queryByText('Gloo')).not.toBeInTheDocument();
  });

  it('displays empty state when no counters match lane filter and allows resetting', () => {
    render(<CounterView heroes={mockHeroesPool} selectedHeroId={1} />);

    // Click "Mid Lane" (none of Miya's counters are Mid Lane)
    const midTab = screen.getByTestId('counter-lane-tab-mid-lane');
    fireEvent.click(midTab);

    expect(screen.getByTestId('counters-empty-state')).toBeInTheDocument();

    // Click reset button
    const resetBtn = screen.getByRole('button', { name: /show all lanes & roles/i });
    fireEvent.click(resetBtn);

    // Now all counters are back
    expect(screen.getByText('Gloo')).toBeInTheDocument();
    expect(screen.getByText('Chou')).toBeInTheDocument();
  });

  it('allows changing the target enemy hero via the search picker', () => {
    const onSelectTarget = vi.fn();
    render(
      <CounterView
        heroes={mockHeroesPool}
        selectedHeroId={1}
        onSelectTargetHero={onSelectTarget}
      />
    );

    // Open hero picker
    const changeBtn = screen.getByTestId('change-target-hero-btn');
    fireEvent.click(changeBtn);

    expect(screen.getByTestId('hero-picker-panel')).toBeInTheDocument();

    // Select Chou as new target hero
    const chouOption = screen.getByTestId('picker-hero-26');
    fireEvent.click(chouOption);

    expect(onSelectTarget).toHaveBeenCalledWith(mockChou);
    expect(screen.getByTestId('target-hero-title')).toHaveTextContent('Chou');
  });

  it('calls onViewHeroDetail when clicking a counter hero card', () => {
    const onViewDetail = vi.fn();
    render(
      <CounterView
        heroes={mockHeroesPool}
        selectedHeroId={1}
        onViewHeroDetail={onViewDetail}
      />
    );

    // Click Gloo's card (Gloo is not in mockHeroesPool, but Chou is)
    const chouCard = screen.getByTestId('counter-card-26');
    fireEvent.click(chouCard);

    expect(onViewDetail).toHaveBeenCalledWith(mockChou);
  });
});
