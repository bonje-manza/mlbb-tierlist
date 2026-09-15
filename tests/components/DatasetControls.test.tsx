import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DatasetControls } from '../../src/components/DatasetControls.tsx';

describe('DatasetControls (Seam 1)', () => {
  it('renders rank tier and time window radiogroups with accessible labels', () => {
    render(
      <DatasetControls
        rankTier="mythic"
        onRankTierChange={vi.fn()}
        timeWindow="1d"
        onTimeWindowChange={vi.fn()}
      />
    );

    const rankGroup = screen.getByRole('radiogroup', { name: /rank tier/i });
    expect(rankGroup).toBeInTheDocument();

    const timeGroup = screen.getByRole('radiogroup', { name: /time window/i });
    expect(timeGroup).toBeInTheDocument();
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

    const mythicBtn = screen.getByRole('radio', { name: /mythic/i });
    const allRanksBtn = screen.getByRole('radio', { name: /all ranks/i });
    const oneDayBtn = screen.getByRole('radio', { name: /1 day/i });
    const sevenDaysBtn = screen.getByRole('radio', { name: /7 days/i });

    expect(mythicBtn).toHaveAttribute('aria-checked', 'true');
    expect(allRanksBtn).toHaveAttribute('aria-checked', 'false');
    expect(oneDayBtn).toHaveAttribute('aria-checked', 'true');
    expect(sevenDaysBtn).toHaveAttribute('aria-checked', 'false');
  });

  it('indicates selected state when rank is all and time window is 7d', () => {
    render(
      <DatasetControls
        rankTier="all"
        onRankTierChange={vi.fn()}
        timeWindow="7d"
        onTimeWindowChange={vi.fn()}
      />
    );

    const mythicBtn = screen.getByRole('radio', { name: /mythic/i });
    const allRanksBtn = screen.getByRole('radio', { name: /all ranks/i });
    const oneDayBtn = screen.getByRole('radio', { name: /1 day/i });
    const sevenDaysBtn = screen.getByRole('radio', { name: /7 days/i });

    expect(mythicBtn).toHaveAttribute('aria-checked', 'false');
    expect(allRanksBtn).toHaveAttribute('aria-checked', 'true');
    expect(oneDayBtn).toHaveAttribute('aria-checked', 'false');
    expect(sevenDaysBtn).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onRankTierChange when clicking an unselected rank option', () => {
    const handleRankChange = vi.fn();
    render(
      <DatasetControls
        rankTier="mythic"
        onRankTierChange={handleRankChange}
        timeWindow="1d"
        onTimeWindowChange={vi.fn()}
      />
    );

    const allRanksBtn = screen.getByRole('radio', { name: /all ranks/i });
    fireEvent.click(allRanksBtn);

    expect(handleRankChange).toHaveBeenCalledTimes(1);
    expect(handleRankChange).toHaveBeenCalledWith('all');
  });

  it('does not trigger onRankTierChange when clicking the already selected rank option', () => {
    const handleRankChange = vi.fn();
    render(
      <DatasetControls
        rankTier="mythic"
        onRankTierChange={handleRankChange}
        timeWindow="1d"
        onTimeWindowChange={vi.fn()}
      />
    );

    const mythicBtn = screen.getByRole('radio', { name: /mythic/i });
    fireEvent.click(mythicBtn);

    expect(handleRankChange).not.toHaveBeenCalled();
  });

  it('calls onTimeWindowChange when clicking an unselected time window option', () => {
    const handleTimeChange = vi.fn();
    render(
      <DatasetControls
        rankTier="mythic"
        onRankTierChange={vi.fn()}
        timeWindow="1d"
        onTimeWindowChange={handleTimeChange}
      />
    );

    const sevenDaysBtn = screen.getByRole('radio', { name: /7 days/i });
    fireEvent.click(sevenDaysBtn);

    expect(handleTimeChange).toHaveBeenCalledTimes(1);
    expect(handleTimeChange).toHaveBeenCalledWith('7d');
  });

  it('does not trigger onTimeWindowChange when clicking the already selected time window option', () => {
    const handleTimeChange = vi.fn();
    render(
      <DatasetControls
        rankTier="mythic"
        onRankTierChange={vi.fn()}
        timeWindow="1d"
        onTimeWindowChange={handleTimeChange}
      />
    );

    const oneDayBtn = screen.getByRole('radio', { name: /1 day/i });
    fireEvent.click(oneDayBtn);

    expect(handleTimeChange).not.toHaveBeenCalled();
  });

  it('ensures all interactive toggle buttons satisfy >= 44x44px touch targets', () => {
    render(
      <DatasetControls
        rankTier="mythic"
        onRankTierChange={vi.fn()}
        timeWindow="1d"
        onTimeWindowChange={vi.fn()}
      />
    );

    const buttons = screen.getAllByRole('radio');
    expect(buttons).toHaveLength(4);
    for (const btn of buttons) {
      expect(btn.className).toMatch(/min-h-\[44px\]/);
      expect(btn.className).toMatch(/min-w-\[44px\]/);
    }
  });

  it('disables buttons and prevents callbacks when disabled={true}', () => {
    const handleRankChange = vi.fn();
    const handleTimeChange = vi.fn();
    render(
      <DatasetControls
        rankTier="mythic"
        onRankTierChange={handleRankChange}
        timeWindow="1d"
        onTimeWindowChange={handleTimeChange}
        disabled={true}
      />
    );

    const allRanksBtn = screen.getByRole('radio', { name: /all ranks/i });
    fireEvent.click(allRanksBtn);
    expect(handleRankChange).not.toHaveBeenCalled();

    const sevenDaysBtn = screen.getByRole('radio', { name: /7 days/i });
    fireEvent.click(sevenDaysBtn);
    expect(handleTimeChange).not.toHaveBeenCalled();
  });
});
