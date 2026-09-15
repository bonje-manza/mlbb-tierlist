import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { EmptyState } from '../../src/components/EmptyState.tsx';

describe('EmptyState Component', () => {
  it('renders testId, icon, title, description, and action button', () => {
    const handleAction = vi.fn();
    render(
      <EmptyState
        testId="custom-empty-state"
        icon="🔍"
        title="No items found"
        description="Try adjusting your filters"
        actionLabel="Reset Filters"
        onAction={handleAction}
      />
    );

    const container = screen.getByTestId('custom-empty-state');
    expect(container).toBeInTheDocument();
    expect(screen.getByText('🔍')).toBeInTheDocument();
    expect(screen.getByText('No items found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument();

    const actionBtn = screen.getByRole('button', { name: /reset filters/i });
    expect(actionBtn).toBeInTheDocument();
    expect(actionBtn.className).toMatch(/min-h-\[(44px|48px)\]/);
    expect(actionBtn.className).toMatch(/min-w-\[(44px|48px)\]/);

    fireEvent.click(actionBtn);
    expect(handleAction).toHaveBeenCalledTimes(1);
  });
});
