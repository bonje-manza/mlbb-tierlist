import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act, within } from '@testing-library/react';
import React from 'react';
import { TierListDashboard } from '../../src/components/TierListDashboard.tsx';
import {
  mockDataset,
  mockMultiLaneDataset,
  mockSynergyDataset,
  mockMythic1dDataset,
  mockMythic7dDataset,
  mockAll1dDataset,
  mockAll7dDataset
} from './mockHeroes.ts';

describe('TierListDashboard', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState(null, '', '/');
  });
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

  describe('Hero Detail Bottom Sheet Drawer (Seam 4)', () => {
    it('opens bottom sheet drawer with hero details when tapping a hero tile in standard grid', () => {
      render(<TierListDashboard dataset={mockDataset} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      // Click Rafaela tile
      const rafaelaTile = screen.getByRole('button', { name: /Rafaela/i });
      fireEvent.click(rafaelaTile);

      // Drawer is open
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: 'Rafaela' })).toBeInTheDocument();
      expect(screen.getByTestId('metric-winrate-value')).toHaveTextContent('57.95%');
      expect(screen.getByText('S+ TIER')).toBeInTheDocument();
    });

    it('opens bottom sheet drawer when tapping a hero tile in Ban Priority mode', () => {
      render(<TierListDashboard dataset={mockMultiLaneDataset} />);

      // Toggle Ban Priority
      const banToggle = screen.getByRole('button', { name: /ban priority/i });
      fireEvent.click(banToggle);

      const banGrid = screen.getByTestId('ban-priority-grid');
      const glooTile = banGrid.querySelector('button'); // Gloo is highest ban rate
      expect(glooTile).not.toBeNull();
      fireEvent.click(glooTile!);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: 'Gloo' })).toBeInTheDocument();
      expect(screen.getByTestId('metric-banrate-value')).toHaveTextContent('48.79%');
    });

    it('dismisses drawer when close button is clicked and returns to full dashboard view', () => {
      render(<TierListDashboard dataset={mockDataset} />);

      const rafaelaTile = screen.getByRole('button', { name: /Rafaela/i });
      fireEvent.click(rafaelaTile);
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      const closeBtn = screen.getByRole('button', { name: /close hero details/i });
      fireEvent.click(closeBtn);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('navigates to partner hero when tapping a synergy partner card inside drawer', () => {
      render(<TierListDashboard dataset={mockSynergyDataset} />);

      // Open Rafaela's drawer
      const rafaelaTile = screen.getByRole('button', { name: /Rafaela/i });
      fireEvent.click(rafaelaTile);

      expect(screen.getByRole('heading', { level: 2, name: 'Rafaela' })).toBeInTheDocument();

      // Click Faramis synergy partner card inside drawer
      const dialog = screen.getByRole('dialog');
      const faramisPartnerBtn = within(dialog).getByRole('button', { name: /faramis/i });
      fireEvent.click(faramisPartnerBtn);

      // Drawer now displays Faramis details
      expect(screen.getByRole('heading', { level: 2, name: 'Faramis' })).toBeInTheDocument();
      expect(screen.getByTestId('metric-winrate-value')).toHaveTextContent('55.12%');
      expect(screen.getByText('S TIER')).toBeInTheDocument();
    });

    it('fires optional onSelectHero callback prop when provided', () => {
      const handleSelect = vi.fn();
      render(<TierListDashboard dataset={mockDataset} onSelectHero={handleSelect} />);

      const rafaelaTile = screen.getByRole('button', { name: /Rafaela/i });
      fireEvent.click(rafaelaTile);

      expect(handleSelect).toHaveBeenCalledTimes(1);
      expect(handleSelect).toHaveBeenCalledWith(mockDataset.heroes[0]);
    });
  });

  describe('Rank & Time Dropdowns and Multi-Dataset Management (Seam 5)', () => {
    it('renders DatasetControls with default Mythic and 1 Day selected', () => {
      render(<TierListDashboard dataset={mockMythic1dDataset} />);
      const rankSelect = screen.getByRole('combobox', { name: /rank tier/i });
      const timeSelect = screen.getByRole('combobox', { name: /time window/i });
      expect(rankSelect).toHaveValue('mythic');
      expect(timeSelect).toHaveValue('1d');
    });

    it('switches to All Ranks dataset in-memory when selecting All Ranks', () => {
      render(
        <TierListDashboard
          datasets={{
            'mythic-1d': mockMythic1dDataset,
            'all-1d': mockAll1dDataset
          }}
        />
      );

      // Initially mythic-1d: Rafaela is S+ (88.4), Miya is A (73.1)
      expect(screen.getByTestId('tier-grid-S+')).toHaveTextContent('Rafaela');
      expect(screen.getByTestId('tier-grid-A')).toHaveTextContent('Miya');

      // Select All Ranks
      fireEvent.change(screen.getByRole('combobox', { name: /rank tier/i }), {
        target: { value: 'all' }
      });

      // Now all-1d: Miya is S (79.5), Rafaela is A (64.0)
      expect(screen.getByTestId('tier-grid-S')).toHaveTextContent('Miya');
      expect(screen.getByTestId('tier-grid-A')).toHaveTextContent('Rafaela');
    });

    it('switches to 7 Days dataset in-memory when selecting 7 Days', () => {
      render(
        <TierListDashboard
          datasets={{
            'mythic-1d': mockMythic1dDataset,
            'mythic-7d': mockMythic7dDataset
          }}
        />
      );

      // Initially mythic 1d: Rafaela WR is 57.95% (in tile badge: 58.0%)
      expect(screen.getByText('58.0%')).toBeInTheDocument();

      // Select 7 Days
      fireEvent.change(screen.getByRole('combobox', { name: /time window/i }), {
        target: { value: '7d' }
      });

      // Now mythic 7d: Rafaela WR is 56.20% (in tile badge: 56.2%)
      expect(screen.getByText('56.2%')).toBeInTheDocument();
    });

    it('preserves active Lane filter when toggling rank or time window', () => {
      render(
        <TierListDashboard
          datasets={{
            'mythic-1d': mockMythic1dDataset,
            'all-1d': mockAll1dDataset
          }}
        />
      );

      // Filter by Gold Lane (Miya is Gold Lane)
      fireEvent.click(screen.getByTestId('lane-tab-Gold'));
      expect(screen.getByText('Miya')).toBeInTheDocument();
      expect(screen.queryByText('Rafaela')).not.toBeInTheDocument();

      // Switch rank to All Ranks
      fireEvent.change(screen.getByRole('combobox', { name: /rank tier/i }), {
        target: { value: 'all' }
      });

      // Lane filter remains active: Gold Lane still selected, Miya still shown, Rafaela still excluded
      expect(screen.getByTestId('lane-tab-Gold')).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByText('Miya')).toBeInTheDocument();
      expect(screen.queryByText('Rafaela')).not.toBeInTheDocument();
    });

    it('preserves active search query when toggling rank or time window', () => {
      vi.useFakeTimers();
      render(
        <TierListDashboard
          datasets={{
            'mythic-1d': mockMythic1dDataset,
            'mythic-7d': mockMythic7dDataset
          }}
        />
      );

      const searchInput = screen.getByRole('textbox', { name: /search hero/i });
      fireEvent.change(searchInput, { target: { value: 'Chou' } });
      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(screen.getByText('Chou')).toBeInTheDocument();
      expect(screen.queryByText('Miya')).not.toBeInTheDocument();

      // Switch to 7 Days
      fireEvent.change(screen.getByRole('combobox', { name: /time window/i }), {
        target: { value: '7d' }
      });

      // Search remains active
      expect(screen.getByRole('textbox', { name: /search hero/i })).toHaveValue('Chou');
      expect(screen.getByText('Chou')).toBeInTheDocument();
      expect(screen.queryByText('Miya')).not.toBeInTheDocument();
      vi.useRealTimers();
    });

    it('updates inspected hero stats in open bottom sheet when toggling dataset', () => {
      render(
        <TierListDashboard
          datasets={{
            'mythic-1d': mockMythic1dDataset,
            'all-1d': mockAll1dDataset
          }}
        />
      );

      // Open Miya's drawer in Mythic 1d (WR 53.81%, Tier A)
      fireEvent.click(screen.getByRole('button', { name: /Miya/i }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByTestId('metric-winrate-value')).toHaveTextContent('53.81%');
      expect(screen.getByText('A TIER')).toBeInTheDocument();

      // Toggle to All Ranks while drawer is open
      fireEvent.change(screen.getByRole('combobox', { name: /rank tier/i }), {
        target: { value: 'all' }
      });

      // Drawer stays open and updates to All Ranks Miya (WR 55.60%, Tier S)
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByTestId('metric-winrate-value')).toHaveTextContent('55.60%');
      expect(screen.getByText('S TIER')).toBeInTheDocument();
    });

    it('fetches remote static dataset file when not present in memory cache', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        if (url.toString().includes('tierlist-all-1d.json')) {
          return new Response(JSON.stringify(mockAll1dDataset), { status: 200 });
        }
        return new Response(JSON.stringify(mockMythic1dDataset), { status: 200 });
      });

      render(<TierListDashboard dataset={mockMythic1dDataset} />);

      // Switch to All Ranks (uncached)
      fireEvent.change(screen.getByRole('combobox', { name: /rank tier/i }), {
        target: { value: 'all' }
      });

      await waitFor(() => {
        expect(screen.getByTestId('tier-grid-S')).toHaveTextContent('Miya');
      });

      expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('tierlist-all-1d.json'));
      fetchSpy.mockRestore();
    });

    it('maintains zero layout jumps: hero grid remains mounted with loading bar during uncached fetch', async () => {
      let resolvePromise: (res: Response) => void;
      const delayedResponse = new Promise<Response>((resolve) => {
        resolvePromise = resolve;
      });

      vi.spyOn(globalThis, 'fetch').mockReturnValue(delayedResponse);

      render(<TierListDashboard dataset={mockMythic1dDataset} />);

      // Initial grid is visible with Rafaela
      expect(screen.getByText('Rafaela')).toBeInTheDocument();

      // Switch to All Ranks (uncached)
      fireEvent.change(screen.getByRole('combobox', { name: /rank tier/i }), {
        target: { value: 'all' }
      });

      // Hero grid remains mounted (no full-page spinner unmounting heroes)
      expect(screen.getByText('Rafaela')).toBeInTheDocument();
      expect(screen.getByTestId('dataset-loading-bar')).toBeInTheDocument();

      // Resolve the fetch
      act(() => {
        resolvePromise(new Response(JSON.stringify(mockAll1dDataset), { status: 200 }));
      });

      await waitFor(() => {
        expect(screen.queryByTestId('dataset-loading-bar')).not.toBeInTheDocument();
      });
      expect(screen.getByText('Miya')).toBeInTheDocument();
      vi.restoreAllMocks();
    });

    it('prevents race conditions: slow stale response does not overwrite newer selection', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        const urlStr = url.toString();
        if (urlStr.includes('tierlist-all-1d.json')) {
          // Slow response
          await new Promise((r) => setTimeout(r, 80));
          return new Response(JSON.stringify(mockAll1dDataset), { status: 200 });
        }
        return new Response(JSON.stringify(mockMythic7dDataset), { status: 200 });
      });

      render(<TierListDashboard dataset={mockMythic1dDataset} />);

      // Rapidly select All Ranks then 7 Days
      fireEvent.change(screen.getByRole('combobox', { name: /rank tier/i }), {
        target: { value: 'all' }
      });
      fireEvent.change(screen.getByRole('combobox', { name: /time window/i }), {
        target: { value: '7d' }
      });

      await waitFor(() => {
        expect(screen.getByText('56.2%')).toBeInTheDocument(); // Mythic 7d
      });

      // Wait past slow response completion
      await new Promise((r) => setTimeout(r, 100));

      // Grid must still display Mythic 7d
      expect(screen.getByText('56.2%')).toBeInTheDocument();

      fetchSpy.mockRestore();
    });

    it('synchronizes selected rank and window to URL search params and localStorage', () => {
      const replaceStateSpy = vi.spyOn(window.history, 'replaceState');
      render(
        <TierListDashboard
          datasets={{
            'mythic-1d': mockMythic1dDataset,
            'glory-30d': { ...mockMythic1dDataset, rankTier: 'glory', timeWindow: '30d' }
          }}
        />
      );

      fireEvent.change(screen.getByRole('combobox', { name: /rank tier/i }), {
        target: { value: 'glory' }
      });
      fireEvent.change(screen.getByRole('combobox', { name: /time window/i }), {
        target: { value: '30d' }
      });

      expect(localStorage.getItem('mlbb_tierlist_rank')).toBe('glory');
      expect(localStorage.getItem('mlbb_tierlist_window')).toBe('30d');
      expect(replaceStateSpy).toHaveBeenCalled();
      replaceStateSpy.mockRestore();
    });
  });
});

