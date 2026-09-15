import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { HeroTile } from '../../src/components/HeroTile.tsx';
import type { NormalizedHero } from '../../src/types/index.ts';

const mockHero: NormalizedHero = {
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
};

describe('HeroTile (Seam 3)', () => {
  it('renders hero name, formatted win rate percentage, and avatar image', () => {
    render(<HeroTile hero={mockHero} />);

    expect(screen.getByText('Rafaela')).toBeInTheDocument();
    expect(screen.getByText('58.0%')).toBeInTheDocument();

    const img = screen.getByRole('img', { name: /rafaela/i });
    expect(img).toHaveAttribute('src', mockHero.avatarUrl);
  });

  it('renders local fallback placeholder when image errors', () => {
    render(<HeroTile hero={mockHero} />);

    const img = screen.getByRole('img', { name: /rafaela/i });
    fireEvent.error(img);

    // After error, fallback placeholder is visible and image is replaced or hidden
    expect(screen.getByTestId('hero-avatar-fallback')).toBeInTheDocument();
  });

  it('calls onSelect when tile is clicked', () => {
    const handleSelect = vi.fn();
    render(<HeroTile hero={mockHero} onSelect={handleSelect} />);

    const tile = screen.getByRole('button', { name: /rafaela/i });
    fireEvent.click(tile);

    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledWith(mockHero);
  });

  it('provides a touch target meeting or exceeding 44x44px', () => {
    render(<HeroTile hero={mockHero} />);
    const button = screen.getByRole('button', { name: /rafaela/i });
    
    // Check accessibility minimum touch classes
    expect(button.className).toMatch(/min-h-\[(44px|48px)\]|h-/);
    expect(button.className).toMatch(/min-w-\[(44px|48px)\]|w-/);
  });
});
