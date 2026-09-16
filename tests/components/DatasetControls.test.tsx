import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DatasetControls } from '../../src/components/DatasetControls.tsx';

describe('DatasetControls (Full Ladder Dropdowns)', () => {
  it('renders rank tier and time window selects with accessible labels', () => {
    render(
      <DatasetControls
        rankTier="mythic"
        onRankTierChange={vi.fn()}
        timeWindow="1d"
        onTimeWindowChange={vi.fn()}
      />
    );

    const rankSelect = screen.getByRole('combobox', { name: /rank tier/i });
    expect(rankSelect).toBeInTheDocument();

    const timeSelect = screen.getByRole('combobox', { name: /time window/i });
    expect(timeSelect).toBeInTheDocument();
  });

  it('renders all 6 full ladder rank options and 5 time window options', () => {
    render(
      <DatasetControls
        rankTier="mythic"
        onRankTierChange={vi.fn()}
        timeWindow="1d"
        onTimeWindowChange={vi.fn()}
      />
    );

    const rankSelect = screen.getByRole('combobox', { name: /rank tier/i });
    const rankOptions = Array.from(rankSelect.querySelectorAll('option')).map((o) => o.value);
    expect(rankOptions).toEqual(['all', 'epic', 'legend', 'mythic', 'honor', 'glory']);

    const timeSelect = screen.getByRole('combobox', { name: /time window/i });
    const timeOptions = Array.from(timeSelect.querySelectorAll('option')).map((o) => o.value);
    expect(timeOptions).toEqual(['1d', '3d', '7d', '15d', '30d']);
  });

  it('indicates selected state for default mythic rank and 1d time window', () => {
    render(
      <DatasetControls
        rankTier="mythic"
        onRankTierChange={vi.fn()}
        timeWindow="1d"
        onTimeWindowChange={vi.fn()}
      />
    );

    const rankSelect = screen.getByRole('combobox', { name: /rank tier/i }) as HTMLSelectElement;
    const timeSelect = screen.getByRole('combobox', { name: /time window/i }) as HTMLSelectElement;

    expect(rankSelect.value).toBe('mythic');
    expect(timeSelect.value).toBe('1d');
  });

  it('indicates selected state when rank is glory and time window is 30d', () => {
    render(
      <DatasetControls
        rankTier="glory"
        onRankTierChange={vi.fn()}
        timeWindow="30d"
        onTimeWindowChange={vi.fn()}
      />
    );

    const rankSelect = screen.getByRole('combobox', { name: /rank tier/i }) as HTMLSelectElement;
    const timeSelect = screen.getByRole('combobox', { name: /time window/i }) as HTMLSelectElement;

    expect(rankSelect.value).toBe('glory');
    expect(timeSelect.value).toBe('30d');
    expect(screen.getByTestId('rank-tier-label')).toHaveTextContent('Mythical Glory+');
  });

  it('renders visible label for Mythical Honor correctly', () => {
    render(
      <DatasetControls
        rankTier="honor"
        onRankTierChange={vi.fn()}
        timeWindow="7d"
        onTimeWindowChange={vi.fn()}
      />
    );

    expect(screen.getByTestId('rank-tier-label')).toHaveTextContent('Mythical Honor');
  });

  it('calls onRankTierChange when selecting a different rank option', () => {
    const handleRankChange = vi.fn();
    render(
      <DatasetControls
        rankTier="mythic"
        onRankTierChange={handleRankChange}
        timeWindow="1d"
        onTimeWindowChange={vi.fn()}
      />
    );

    const rankSelect = screen.getByRole('combobox', { name: /rank tier/i });
    fireEvent.change(rankSelect, { target: { value: 'glory' } });

    expect(handleRankChange).toHaveBeenCalledTimes(1);
    expect(handleRankChange).toHaveBeenCalledWith('glory');
  });

  it('calls onTimeWindowChange when selecting a different time window option', () => {
    const handleTimeChange = vi.fn();
    render(
      <DatasetControls
        rankTier="mythic"
        onRankTierChange={vi.fn()}
        timeWindow="1d"
        onTimeWindowChange={handleTimeChange}
      />
    );

    const timeSelect = screen.getByRole('combobox', { name: /time window/i });
    fireEvent.change(timeSelect, { target: { value: '7d' } });

    expect(handleTimeChange).toHaveBeenCalledTimes(1);
    expect(handleTimeChange).toHaveBeenCalledWith('7d');
  });

  it('ensures all interactive select elements satisfy >= 44x44px touch targets', () => {
    render(
      <DatasetControls
        rankTier="mythic"
        onRankTierChange={vi.fn()}
        timeWindow="1d"
        onTimeWindowChange={vi.fn()}
      />
    );

    const selects = screen.getAllByRole('combobox');
    expect(selects).toHaveLength(2);
    for (const sel of selects) {
      expect(sel.className).toMatch(/min-h-\[44px\]/);
      expect(sel.className).toMatch(/min-w-\[44px\]/);
    }
  });

  it('disables selects and prevents interaction when disabled={true}', () => {
    render(
      <DatasetControls
        rankTier="mythic"
        onRankTierChange={vi.fn()}
        timeWindow="1d"
        onTimeWindowChange={vi.fn()}
        disabled={true}
      />
    );

    const rankSelect = screen.getByRole('combobox', { name: /rank tier/i }) as HTMLSelectElement;
    const timeSelect = screen.getByRole('combobox', { name: /time window/i }) as HTMLSelectElement;

    expect(rankSelect).toBeDisabled();
    expect(timeSelect).toBeDisabled();
  });
});
