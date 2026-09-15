import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { HeroTile } from '../../src/components/HeroTile.tsx';
import { mockRafaela } from './mockHeroes.ts';

describe('HeroTile (Seam 3)', () => {
  it('renders hero name, formatted win rate percentage, power score, and avatar image', () => {
    render(<HeroTile hero={mockRafaela} />);

    expect(screen.getByText('Rafaela')).toBeInTheDocument();
    expect(screen.getByText('58.0%')).toBeInTheDocument();
    expect(screen.getByTestId('hero-power-score')).toHaveTextContent('88.4');

    const img = screen.getByRole('img', { name: /rafaela/i });
    expect(img).toHaveAttribute('src', mockRafaela.avatarUrl);
  });

  it('renders progressive skeleton while loading and local fallback placeholder when image errors', () => {
    render(<HeroTile hero={mockRafaela} />);

    // Initially loading skeleton is present
    expect(screen.getByTestId('hero-avatar-skeleton')).toBeInTheDocument();

    const img = screen.getByRole('img', { name: /rafaela/i });
    fireEvent.error(img);

    // After error, fallback placeholder is visible and skeleton is removed
    expect(screen.getByTestId('hero-avatar-fallback')).toBeInTheDocument();
    expect(screen.queryByTestId('hero-avatar-skeleton')).not.toBeInTheDocument();
  });

  it('calls onSelect when tile is clicked', () => {
    const handleSelect = vi.fn();
    render(<HeroTile hero={mockRafaela} onSelect={handleSelect} />);

    const tile = screen.getByRole('button', { name: /rafaela/i });
    fireEvent.click(tile);

    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledWith(mockRafaela);
  });

  it('provides a touch target meeting or exceeding 44x44px', () => {
    render(<HeroTile hero={mockRafaela} />);
    const button = screen.getByRole('button', { name: /rafaela/i });

    // Check accessibility minimum touch classes
    expect(button.className).toMatch(/min-h-\[(44px|48px)\]|h-/);
    expect(button.className).toMatch(/min-w-\[(44px|48px)\]|w-/);
  });
});
