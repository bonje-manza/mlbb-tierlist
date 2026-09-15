import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { TierListDashboard } from '../../src/components/TierListDashboard.tsx';
import { mockDataset } from './mockHeroes.ts';

describe('TierListDashboard (Seam 1)', () => {
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
