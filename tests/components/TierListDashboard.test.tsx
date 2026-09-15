import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { TierListDashboard } from '../../src/components/TierListDashboard.tsx';
import { mockDataset, mockMultiLaneDataset } from './mockHeroes.ts';

describe('TierListDashboard', () => {
  describe('Core Dashboard (Seam 1)', () => {
    it('renders header with dynamic UTC freshness and patch version from dataset prop', () => {
      render(<TierListDashboard dataset={mockDataset} />);

      expect(screen.getByTestId('patch-version-tag')).toHaveTextContent('Patch 2.1.88');
      expect(screen.getByTestId('data-freshness-badge')).toHaveTextContent(
        'Data updated: 2026-09-14 14:55 UTC'
      );
    });

    it('groups heroes into corresponding tier bands', () => {
      render(<TierListDashboard dataset={mockDataset} />);

      // Rafaela in S+ tier
      const sPlusGrid = screen.getByTestId('tier-grid-S+');
      expect(sPlusGrid).toHaveTextContent('Rafaela');

      // Miya in A tier
      const aGrid = screen.getByTestId('tier-grid-A');
      expect(aGrid).toHaveTextContent('Miya');

      // All tier headers present
      expect(screen.getByText('S+')).toBeInTheDocument();
      expect(screen.getByText('S')).toBeInTheDocument();
      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('B')).toBeInTheDocument();
      expect(screen.getByText('C')).toBeInTheDocument();
      expect(screen.getByText('D')).toBeInTheDocument();
    });

    it('fetches dataset from dataUrl when no dataset prop is provided', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockDataset
      } as Response);

      render(<TierListDashboard dataUrl="/data/mock-tierlist.json" />);

      await waitFor(() => {
        expect(screen.getByText('Rafaela')).toBeInTheDocument();
      });

      expect(fetchSpy).toHaveBeenCalledWith('/data/mock-tierlist.json');
      fetchSpy.mockRestore();
    });

    it('displays error state when data fetch fails', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      } as Response);

      render(<TierListDashboard dataUrl="/data/nonexistent.json" />);

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /Failed to load tier list telemetry/i })
        ).toBeInTheDocument();
      });

      fetchSpy.mockRestore();
    });
  });

  describe('Lane Carousel and Flex-Picks (Seam 2)', () => {
    it('renders the lane carousel with hero counts', () => {
      render(<TierListDashboard dataset={mockMultiLaneDataset} />);

      expect(screen.getByRole('navigation', { name: /lane selection/i })).toBeInTheDocument();
      expect(screen.getByTestId('lane-tab-All')).toBeInTheDocument();
      expect(screen.getByTestId('lane-count-All')).toHaveTextContent('5');
      expect(screen.getByTestId('lane-count-EXP')).toHaveTextContent('2');
      expect(screen.getByTestId('lane-count-Roam')).toHaveTextContent('2');
    });

    it('filters heroes strictly by selected lane tab', () => {
      render(<TierListDashboard dataset={mockMultiLaneDataset} />);

      // Initially All heroes are visible
      expect(screen.getByText('Miya')).toBeInTheDocument();
      expect(screen.getByText('Gloo')).toBeInTheDocument();
      expect(screen.getByText('Rafaela')).toBeInTheDocument();

      // Click Gold lane tab
      fireEvent.click(screen.getByTestId('lane-tab-Gold'));
      expect(screen.getByText('Miya')).toBeInTheDocument();
      expect(screen.queryByText('Gloo')).not.toBeInTheDocument();
      expect(screen.queryByText('Rafaela')).not.toBeInTheDocument();
      expect(screen.queryByText('Chou')).not.toBeInTheDocument();
      expect(screen.queryByText('Julian')).not.toBeInTheDocument();

      // Click Mid lane tab
      fireEvent.click(screen.getByTestId('lane-tab-Mid'));
      expect(screen.getByText('Julian')).toBeInTheDocument();
      expect(screen.queryByText('Miya')).not.toBeInTheDocument();
      expect(screen.queryByText('Gloo')).not.toBeInTheDocument();

      // Click All tab to restore full list
      fireEvent.click(screen.getByTestId('lane-tab-All'));
      expect(screen.getByText('Miya')).toBeInTheDocument();
      expect(screen.getByText('Gloo')).toBeInTheDocument();
      expect(screen.getByText('Rafaela')).toBeInTheDocument();
      expect(screen.getByText('Chou')).toBeInTheDocument();
      expect(screen.getByText('Julian')).toBeInTheDocument();
    });

    it('includes multi-lane flex-pick heroes across all assigned lane tabs', () => {
      render(<TierListDashboard dataset={mockMultiLaneDataset} />);

      // Chou is in EXP Lane + Roam
      fireEvent.click(screen.getByTestId('lane-tab-EXP'));
      expect(screen.getByText('Chou')).toBeInTheDocument();
      expect(screen.getByText('Gloo')).toBeInTheDocument();
      expect(screen.queryByText('Rafaela')).not.toBeInTheDocument();

      fireEvent.click(screen.getByTestId('lane-tab-Roam'));
      expect(screen.getByText('Chou')).toBeInTheDocument();
      expect(screen.getByText('Rafaela')).toBeInTheDocument();
      expect(screen.queryByText('Gloo')).not.toBeInTheDocument();

      // Julian is in Mid Lane + Jungle
      fireEvent.click(screen.getByTestId('lane-tab-Jungle'));
      expect(screen.getByText('Julian')).toBeInTheDocument();
      expect(screen.queryByText('Chou')).not.toBeInTheDocument();

      fireEvent.click(screen.getByTestId('lane-tab-Mid'));
      expect(screen.getByText('Julian')).toBeInTheDocument();
      expect(screen.queryByText('Chou')).not.toBeInTheDocument();
    });

    it('preserves power score ordering and tier grouping when lane filtered', () => {
      render(<TierListDashboard dataset={mockMultiLaneDataset} />);

      // Filter by EXP: Gloo (S+) and Chou (A)
      fireEvent.click(screen.getByTestId('lane-tab-EXP'));

      const sPlusGrid = screen.getByTestId('tier-grid-S+');
      expect(sPlusGrid).toHaveTextContent('Gloo');
      expect(sPlusGrid).not.toHaveTextContent('Chou');

      const aGrid = screen.getByTestId('tier-grid-A');
      expect(aGrid).toHaveTextContent('Chou');
      expect(aGrid).not.toHaveTextContent('Gloo');
    });

    it('renders lane-level empty state when no heroes match the selected lane filter', () => {
      // mockDataset only has Rafaela (Roam) and Miya (Gold)
      render(<TierListDashboard dataset={mockDataset} />);

      // Filter by Mid lane (0 heroes)
      fireEvent.click(screen.getByTestId('lane-tab-Mid'));

      const emptyState = screen.getByTestId('lane-empty-state');
      expect(emptyState).toBeInTheDocument();
      expect(emptyState).toHaveTextContent(/No heroes found in Mid/i);

      // Tier grids should not be rendered in empty state
      expect(screen.queryByTestId('tier-grid-S+')).not.toBeInTheDocument();

      // Reset button restores All Lanes
      fireEvent.click(screen.getByRole('button', { name: /Reset to All Lanes/i }));
      expect(screen.getByText('Rafaela')).toBeInTheDocument();
      expect(screen.getByText('Miya')).toBeInTheDocument();
      expect(screen.queryByTestId('lane-empty-state')).not.toBeInTheDocument();
    });
  });

  describe('Debounced Search and Ban Priority Sort (Seam 3)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('filters visible heroes with 150ms debounce when typing in search input', () => {
      render(<TierListDashboard dataset={mockMultiLaneDataset} />);

      const searchInput = screen.getByRole('textbox', { name: /search hero/i });
      fireEvent.change(searchInput, { target: { value: 'Chou' } });

      // Before 150ms debounce, all heroes still visible
      expect(screen.getByText('Miya')).toBeInTheDocument();
      expect(screen.getByText('Chou')).toBeInTheDocument();

      // Advance debounce timer
      act(() => {
        vi.advanceTimersByTime(150);
      });

      // After 150ms, only Chou matches
      expect(screen.getByText('Chou')).toBeInTheDocument();
      expect(screen.queryByText('Miya')).not.toBeInTheDocument();
      expect(screen.queryByText('Gloo')).not.toBeInTheDocument();
    });

    it('restores full hero list immediately when clicking clear button', () => {
      render(<TierListDashboard dataset={mockMultiLaneDataset} />);

      const searchInput = screen.getByRole('textbox', { name: /search hero/i });
      fireEvent.change(searchInput, { target: { value: 'Chou' } });
      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(screen.queryByText('Miya')).not.toBeInTheDocument();

      const clearButton = screen.getByRole('button', { name: /clear search/i });
      fireEvent.click(clearButton);

      // Immediately restored without delay
      expect(screen.getByText('Chou')).toBeInTheDocument();
      expect(screen.getByText('Miya')).toBeInTheDocument();
      expect(screen.getByText('Gloo')).toBeInTheDocument();
    });

    it('renders search empty state with reset button when query has no matches', () => {
      render(<TierListDashboard dataset={mockMultiLaneDataset} />);

      const searchInput = screen.getByRole('textbox', { name: /search hero/i });
      fireEvent.change(searchInput, { target: { value: 'Layla' } });
      act(() => {
        vi.advanceTimersByTime(150);
      });

      const emptyState = screen.getByTestId('search-empty-state');
      expect(emptyState).toBeInTheDocument();
      expect(emptyState).toHaveTextContent(/No heroes found matching "Layla"/i);

      // Click Reset Search button
      const resetBtn = screen.getByRole('button', { name: /reset search/i });
      fireEvent.click(resetBtn);

      expect(screen.queryByTestId('search-empty-state')).not.toBeInTheDocument();
      expect(screen.getByText('Miya')).toBeInTheDocument();
      expect(screen.getByText('Gloo')).toBeInTheDocument();
    });

    it('reorders heroes strictly by descending ban rate when Ban Priority is toggled', () => {
      render(<TierListDashboard dataset={mockMultiLaneDataset} />);

      const banToggle = screen.getByRole('button', { name: /ban priority/i });
      fireEvent.click(banToggle);

      // Ban priority grid should be rendered
      const banGrid = screen.getByTestId('ban-priority-grid');
      expect(banGrid).toBeInTheDocument();

      // Check order of tiles inside ban-priority-grid:
      // Gloo: 48.79%, Julian: 25.4%, Miya: 24.87%, Rafaela: 10.91%, Chou: 8.2%
      const buttons = banGrid.querySelectorAll('button');
      const names = Array.from(buttons).map((btn) => btn.querySelector('img')?.getAttribute('alt'));
      expect(names).toEqual(['Gloo', 'Julian', 'Miya', 'Rafaela', 'Chou']);

      // Toggle off Ban Priority restores standard tier view
      fireEvent.click(banToggle);
      expect(screen.queryByTestId('ban-priority-grid')).not.toBeInTheDocument();
      expect(screen.getByTestId('tier-grid-S+')).toBeInTheDocument();
    });

    it('composes search, ban priority, and active lane filters seamlessly', () => {
      render(<TierListDashboard dataset={mockMultiLaneDataset} />);

      // 1. Select EXP Lane (Gloo & Chou)
      fireEvent.click(screen.getByTestId('lane-tab-EXP'));
      expect(screen.getByText('Gloo')).toBeInTheDocument();
      expect(screen.getByText('Chou')).toBeInTheDocument();
      expect(screen.queryByText('Miya')).not.toBeInTheDocument();

      // 2. Toggle Ban Priority while in EXP Lane
      const banToggle = screen.getByRole('button', { name: /ban priority/i });
      fireEvent.click(banToggle);

      const banGrid = screen.getByTestId('ban-priority-grid');
      const buttons = banGrid.querySelectorAll('button');
      const names = Array.from(buttons).map((btn) => btn.querySelector('img')?.getAttribute('alt'));
      expect(names).toEqual(['Gloo', 'Chou']); // Gloo (48.8%) then Chou (8.2%)

      // 3. Search within active lane and ban priority
      const searchInput = screen.getByRole('textbox', { name: /search hero/i });
      fireEvent.change(searchInput, { target: { value: 'Chou' } });
      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(screen.getByText('Chou')).toBeInTheDocument();
      expect(screen.queryByText('Gloo')).not.toBeInTheDocument();

      // 4. Searching for a hero outside EXP lane (e.g. Miya) shows search empty state
      fireEvent.change(searchInput, { target: { value: 'Miya' } });
      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(screen.getByTestId('search-empty-state')).toBeInTheDocument();
      expect(screen.queryByText('Miya')).not.toBeInTheDocument();
    });
  });
});


