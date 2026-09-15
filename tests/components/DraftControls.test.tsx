import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { DraftControls } from '../../src/components/DraftControls.tsx';

describe('DraftControls (Seam 1)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders search input and Ban Priority toggle pill', () => {
    render(
      <DraftControls
        searchQuery=""
        onSearchChange={vi.fn()}
        isBanPriority={false}
        onToggleBanPriority={vi.fn()}
      />
    );

    const input = screen.getByRole('textbox', { name: /search hero/i });
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Search heroes...');

    const banButton = screen.getByRole('button', { name: /ban priority/i });
    expect(banButton).toBeInTheDocument();
    expect(banButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('debounces keystroke updates by 150ms before calling onSearchChange', () => {
    const handleSearchChange = vi.fn();
    render(
      <DraftControls
        searchQuery=""
        onSearchChange={handleSearchChange}
        isBanPriority={false}
        onToggleBanPriority={vi.fn()}
      />
    );

    const input = screen.getByRole('textbox', { name: /search hero/i });

    // User types 'glo'
    fireEvent.change(input, { target: { value: 'glo' } });
    expect(input).toHaveValue('glo');

    // Before 150ms, onSearchChange should not be called
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(handleSearchChange).not.toHaveBeenCalled();

    // After 150ms total, onSearchChange should be called with 'glo'
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(handleSearchChange).toHaveBeenCalledTimes(1);
    expect(handleSearchChange).toHaveBeenCalledWith('glo');
  });

  it('resets timer if another keystroke occurs within 150ms window', () => {
    const handleSearchChange = vi.fn();
    render(
      <DraftControls
        searchQuery=""
        onSearchChange={handleSearchChange}
        isBanPriority={false}
        onToggleBanPriority={vi.fn()}
      />
    );

    const input = screen.getByRole('textbox', { name: /search hero/i });

    fireEvent.change(input, { target: { value: 'g' } });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    fireEvent.change(input, { target: { value: 'gl' } });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(handleSearchChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(handleSearchChange).toHaveBeenCalledTimes(1);
    expect(handleSearchChange).toHaveBeenCalledWith('gl');
  });

  it('renders clear button only when input has text and immediately clears on click', () => {
    const handleSearchChange = vi.fn();
    const { rerender } = render(
      <DraftControls
        searchQuery=""
        onSearchChange={handleSearchChange}
        isBanPriority={false}
        onToggleBanPriority={vi.fn()}
      />
    );

    // When empty, clear button is not present
    expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument();

    const input = screen.getByRole('textbox', { name: /search hero/i });
    fireEvent.change(input, { target: { value: 'Miya' } });

    // Clear button appears
    const clearButton = screen.getByRole('button', { name: /clear search/i });
    expect(clearButton).toBeInTheDocument();

    // Click clear button
    fireEvent.click(clearButton);

    // Clears input immediately and invokes onSearchChange with ''
    expect(input).toHaveValue('');
    expect(handleSearchChange).toHaveBeenCalledWith('');
    expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument();
  });

  it('reflects external search query prop updates in the input', () => {
    const { rerender } = render(
      <DraftControls
        searchQuery="Chou"
        onSearchChange={vi.fn()}
        isBanPriority={false}
        onToggleBanPriority={vi.fn()}
      />
    );

    const input = screen.getByRole('textbox', { name: /search hero/i });
    expect(input).toHaveValue('Chou');

    // External reset to ''
    rerender(
      <DraftControls
        searchQuery=""
        onSearchChange={vi.fn()}
        isBanPriority={false}
        onToggleBanPriority={vi.fn()}
      />
    );
    expect(input).toHaveValue('');
  });

  it('cancels pending debounce timer when searchQuery prop updates externally', () => {
    const handleSearchChange = vi.fn();
    const { rerender } = render(
      <DraftControls
        searchQuery="Layla"
        onSearchChange={handleSearchChange}
        isBanPriority={false}
        onToggleBanPriority={vi.fn()}
      />
    );

    const input = screen.getByRole('textbox', { name: /search hero/i });
    expect(input).toHaveValue('Layla');

    // User types additional characters
    fireEvent.change(input, { target: { value: 'LaylaExtra' } });
    expect(input).toHaveValue('LaylaExtra');

    // External reset arrives before 150ms expires
    rerender(
      <DraftControls
        searchQuery=""
        onSearchChange={handleSearchChange}
        isBanPriority={false}
        onToggleBanPriority={vi.fn()}
      />
    );
    expect(input).toHaveValue('');

    // Advance remaining time
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // onSearchChange should NOT have been called with stale 'Layla'
    expect(handleSearchChange).not.toHaveBeenCalledWith('Layla');
  });

  it('handles Ban Priority toggle click and displays active indicator', () => {
    const handleToggleBan = vi.fn();
    const { rerender } = render(
      <DraftControls
        searchQuery=""
        onSearchChange={vi.fn()}
        isBanPriority={false}
        onToggleBanPriority={handleToggleBan}
      />
    );

    const banButton = screen.getByRole('button', { name: /ban priority/i });
    expect(banButton).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(banButton);
    expect(handleToggleBan).toHaveBeenCalledTimes(1);

    // Re-render as active
    rerender(
      <DraftControls
        searchQuery=""
        onSearchChange={vi.fn()}
        isBanPriority={true}
        onToggleBanPriority={handleToggleBan}
      />
    );

    const activeBanButton = screen.getByRole('button', { name: /ban priority/i });
    expect(activeBanButton).toHaveAttribute('aria-pressed', 'true');
    // Active state indicator dot or badge
    expect(screen.getByTestId('ban-priority-active-dot')).toBeInTheDocument();
  });

  it('satisfies touch target minimums (>= 44x44px) on controls', () => {
    render(
      <DraftControls
        searchQuery="test"
        onSearchChange={vi.fn()}
        isBanPriority={false}
        onToggleBanPriority={vi.fn()}
      />
    );

    const banButton = screen.getByRole('button', { name: /ban priority/i });
    expect(banButton.className).toMatch(/min-h-\[(44px|48px)\]/);
    expect(banButton.className).toMatch(/min-w-\[(44px|48px)\]/);

    const clearButton = screen.getByRole('button', { name: /clear search/i });
    expect(clearButton.className).toMatch(/min-h-\[(44px|48px)\]/);
    expect(clearButton.className).toMatch(/min-w-\[(44px|48px)\]/);
  });
});
