import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { LaneCarousel } from '../../src/components/LaneCarousel.tsx';
import type { LaneFilter } from '../../src/types/index.ts';

describe('LaneCarousel (Seam 1)', () => {
  const defaultCounts: Record<LaneFilter, number> = {
    All: 133,
    Gold: 26,
    EXP: 34,
    Mid: 28,
    Roam: 29,
    Jungle: 27,
  };

  it('renders all 6 canonical lane tabs in draft order', () => {
    render(
      <LaneCarousel
        selectedLane="All"
        onSelectLane={vi.fn()}
        heroCounts={defaultCounts}
      />
    );

    const tabs = ['All', 'Gold', 'EXP', 'Mid', 'Roam', 'Jungle'];
    tabs.forEach((tab) => {
      expect(screen.getByTestId(`lane-tab-${tab}`)).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: new RegExp(tab, 'i') })).toBeInTheDocument();
    });
  });

  it('displays hero count badges for each lane', () => {
    render(
      <LaneCarousel
        selectedLane="All"
        onSelectLane={vi.fn()}
        heroCounts={defaultCounts}
      />
    );

    expect(screen.getByTestId('lane-count-All')).toHaveTextContent('133');
    expect(screen.getByTestId('lane-count-Gold')).toHaveTextContent('26');
    expect(screen.getByTestId('lane-count-EXP')).toHaveTextContent('34');
    expect(screen.getByTestId('lane-count-Mid')).toHaveTextContent('28');
    expect(screen.getByTestId('lane-count-Roam')).toHaveTextContent('29');
    expect(screen.getByTestId('lane-count-Jungle')).toHaveTextContent('27');
  });

  it('meets or exceeds 44x44px touch target dimensions for every tab button', () => {
    render(
      <LaneCarousel
        selectedLane="All"
        onSelectLane={vi.fn()}
        heroCounts={defaultCounts}
      />
    );

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(6);

    tabs.forEach((tab) => {
      expect(tab.className).toMatch(/min-h-\[44px\]/);
      expect(tab.className).toMatch(/min-w-\[44px\]/);
    });
  });

  it('marks active tab with aria-selected="true" and high-contrast neon indicator', () => {
    const { rerender } = render(
      <LaneCarousel
        selectedLane="Gold"
        onSelectLane={vi.fn()}
        heroCounts={defaultCounts}
      />
    );

    const goldTab = screen.getByTestId('lane-tab-Gold');
    const expTab = screen.getByTestId('lane-tab-EXP');

    expect(goldTab).toHaveAttribute('aria-selected', 'true');
    expect(expTab).toHaveAttribute('aria-selected', 'false');

    // High contrast neon indicator present
    expect(screen.getByTestId('lane-active-indicator-Gold')).toBeInTheDocument();
    expect(screen.queryByTestId('lane-active-indicator-EXP')).not.toBeInTheDocument();

    // Rerender with EXP selected
    rerender(
      <LaneCarousel
        selectedLane="EXP"
        onSelectLane={vi.fn()}
        heroCounts={defaultCounts}
      />
    );

    expect(goldTab).toHaveAttribute('aria-selected', 'false');
    expect(expTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('lane-active-indicator-EXP')).toBeInTheDocument();
    expect(screen.queryByTestId('lane-active-indicator-Gold')).not.toBeInTheDocument();
  });

  it('calls onSelectLane callback when a tab is tapped', () => {
    const onSelectLane = vi.fn();
    render(
      <LaneCarousel
        selectedLane="All"
        onSelectLane={onSelectLane}
        heroCounts={defaultCounts}
      />
    );

    fireEvent.click(screen.getByTestId('lane-tab-Mid'));
    expect(onSelectLane).toHaveBeenCalledWith('Mid');

    fireEvent.click(screen.getByTestId('lane-tab-Roam'));
    expect(onSelectLane).toHaveBeenCalledWith('Roam');
  });

  it('provides sticky positioning and horizontal scroll layout', () => {
    render(
      <LaneCarousel
        selectedLane="All"
        onSelectLane={vi.fn()}
        heroCounts={defaultCounts}
      />
    );

    const nav = screen.getByRole('navigation', { name: /lane selection/i });
    expect(nav.className).toMatch(/sticky/);
    expect(nav.className).toMatch(/overflow-x-auto/);
    expect(nav.className).toMatch(/no-scrollbar/);
  });

  it('provides full canonical lane names in accessible labels and enforces roving tabindex', () => {
    render(
      <LaneCarousel
        selectedLane="Gold"
        onSelectLane={vi.fn()}
        heroCounts={defaultCounts}
      />
    );

    const goldTab = screen.getByTestId('lane-tab-Gold');
    const midTab = screen.getByTestId('lane-tab-Mid');

    // Accessible labels contain canonical lane names
    expect(goldTab).toHaveAttribute('aria-label', expect.stringContaining('Gold Lane'));
    expect(midTab).toHaveAttribute('aria-label', expect.stringContaining('Mid Lane'));

    // Roving tabIndex: active is 0, inactive is -1
    expect(goldTab).toHaveAttribute('tabIndex', '0');
    expect(midTab).toHaveAttribute('tabIndex', '-1');
  });

  it('supports keyboard arrow navigation between lane tabs', () => {
    const onSelectLane = vi.fn();
    render(
      <LaneCarousel
        selectedLane="Gold"
        onSelectLane={onSelectLane}
        heroCounts={defaultCounts}
      />
    );

    const goldTab = screen.getByTestId('lane-tab-Gold');

    // ArrowRight moves from Gold to EXP
    fireEvent.keyDown(goldTab, { key: 'ArrowRight' });
    expect(onSelectLane).toHaveBeenCalledWith('EXP');

    // ArrowLeft moves from Gold to All
    fireEvent.keyDown(goldTab, { key: 'ArrowLeft' });
    expect(onSelectLane).toHaveBeenCalledWith('All');

    // End moves to Jungle
    fireEvent.keyDown(goldTab, { key: 'End' });
    expect(onSelectLane).toHaveBeenCalledWith('Jungle');

    // Home moves to All
    fireEvent.keyDown(goldTab, { key: 'Home' });
    expect(onSelectLane).toHaveBeenCalledWith('All');
  });
});

