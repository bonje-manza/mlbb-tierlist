import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { TierSection } from '../../src/components/TierSection.tsx';
import type { NormalizedHero } from '../../src/types/index.ts';

const mockHeroes: NormalizedHero[] = [
  {
    id: 14,
    name: 'Rafaela',
    avatarUrl: 'https://akmweb.youngjoygame.com/web/svnres/img/test/rafaela.png',
    roles: ['Support'],
    lanes: ['Roam'],
    winRate: 0.5795,
    pickRate: 0.0089,
    banRate: 0.1091,
    powerScore: 88.4,
    tier: 'S+',
    synergies: []
  },
  {
    id: 104,
    name: 'Gloo',
    avatarUrl: 'https://akmweb.youngjoygame.com/web/svnres/img/test/gloo.png',
    roles: ['Tank'],
    lanes: ['EXP Lane'],
    winRate: 0.5667,
    pickRate: 0.0048,
    banRate: 0.4879,
    powerScore: 86.2,
    tier: 'S+',
    synergies: []
  }
];

describe('TierSection (Seam 2)', () => {
  it('renders tier badge, descriptor, and hero count', () => {
    render(<TierSection tier="S+" heroes={mockHeroes} />);

    expect(screen.getByText('S+')).toBeInTheDocument();
    expect(screen.getByText(/2 Heroes/i)).toBeInTheDocument();
    expect(screen.getByText(/Must Pick or Ban/i)).toBeInTheDocument();
  });

  it('renders all hero tiles within a 4-column responsive grid container', () => {
    render(<TierSection tier="S+" heroes={mockHeroes} />);

    expect(screen.getByText('Rafaela')).toBeInTheDocument();
    expect(screen.getByText('Gloo')).toBeInTheDocument();

    const grid = screen.getByTestId('tier-grid-S+');
    expect(grid.className).toMatch(/grid-cols-4/);
    expect(grid.className).toMatch(/gap-1\.5/);
  });

  it('renders an empty state notice when heroes array is empty', () => {
    render(<TierSection tier="D" heroes={[]} />);

    expect(screen.getByText('D')).toBeInTheDocument();
    expect(screen.getByText(/0 Heroes/i)).toBeInTheDocument();
    expect(screen.getByText(/No heroes in this tier/i)).toBeInTheDocument();
  });
});
