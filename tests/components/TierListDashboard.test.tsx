import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
});


