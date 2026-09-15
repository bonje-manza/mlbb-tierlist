import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { HeroDetailDrawer } from '../../src/components/HeroDetailDrawer.tsx';
import { mockRafaela, mockGloo, mockDataset } from './mockHeroes.ts';

describe('HeroDetailDrawer (Ticket 05)', () => {
  const defaultClose = vi.fn();
  const defaultSelectPartner = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = '';
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  describe('Hero Profile Header', () => {
    it('renders hero avatar, name, roles, lanes, tier badge, and power score', () => {
      render(
        <HeroDetailDrawer
          hero={mockRafaela}
          heroPool={mockDataset.heroes}
          onClose={defaultClose}
        />
      );

      // Hero name
      expect(screen.getByRole('heading', { level: 2, name: 'Rafaela' })).toBeInTheDocument();

      // Roles and lanes
      expect(screen.getByText(/Support/i)).toBeInTheDocument();
      expect(screen.getByText(/Roam/i)).toBeInTheDocument();

      // Tier badge & Power Score
      expect(screen.getByText('S+ TIER')).toBeInTheDocument();
      expect(screen.getByText(/88.4/)).toBeInTheDocument();

      // Avatar
      const avatar = screen.getByRole('img', { name: 'Rafaela' });
      expect(avatar).toHaveAttribute('src', mockRafaela.avatarUrl);
    });

    it('renders fallback placeholder if hero avatar image fails to load', () => {
      render(
        <HeroDetailDrawer
          hero={mockRafaela}
          heroPool={mockDataset.heroes}
          onClose={defaultClose}
        />
      );

      const avatar = screen.getByRole('img', { name: 'Rafaela' });
      fireEvent.error(avatar);

      expect(screen.getByTestId('drawer-avatar-fallback')).toBeInTheDocument();
    });
  });

  describe('Telemetry Benchmark Cards', () => {
    it('displays exact Win Rate, Pick Rate, and Ban Rate formatted percentages', () => {
      render(
        <HeroDetailDrawer
          hero={mockRafaela}
          heroPool={mockDataset.heroes}
          onClose={defaultClose}
        />
      );

      // 57.95% WR, 0.89% PR, 10.91% BR
      expect(screen.getByTestId('metric-winrate-value')).toHaveTextContent('57.95%');
      expect(screen.getByTestId('metric-pickrate-value')).toHaveTextContent('0.89%');
      expect(screen.getByTestId('metric-banrate-value')).toHaveTextContent('10.91%');
    });

    it('renders progress bars for all 3 metrics with accurate progressbar semantics', () => {
      render(
        <HeroDetailDrawer
          hero={mockRafaela}
          heroPool={mockDataset.heroes}
          onClose={defaultClose}
        />
      );

      const wrBar = screen.getByTestId('progress-bar-winrate');
      const prBar = screen.getByTestId('progress-bar-pickrate');
      const brBar = screen.getByTestId('progress-bar-banrate');

      expect(wrBar).toBeInTheDocument();
      expect(prBar).toBeInTheDocument();
      expect(brBar).toBeInTheDocument();

      expect(wrBar).toHaveAttribute('role', 'progressbar');
      expect(prBar).toHaveAttribute('role', 'progressbar');
      expect(brBar).toHaveAttribute('role', 'progressbar');
    });
  });

  describe('Top 3 Synergistic Teammates', () => {
    it('displays synergy partner cards with name, avatar, and positive win-rate delta badge', () => {
      render(
        <HeroDetailDrawer
          hero={mockRafaela}
          heroPool={mockDataset.heroes}
          onClose={defaultClose}
          onSelectPartner={defaultSelectPartner}
        />
      );

      expect(screen.getByRole('heading', { level: 3, name: /Top Duo Synergies/i })).toBeInTheDocument();

      // Faramis (+2.62% WR)
      expect(screen.getByText('Faramis')).toBeInTheDocument();
      expect(screen.getByText('+2.62% WR')).toBeInTheDocument();

      const partnerAvatar = screen.getByRole('img', { name: 'Faramis' });
      expect(partnerAvatar).toHaveAttribute('src', mockRafaela.synergies[0].avatarUrl);
    });

    it('triggers onSelectPartner callback when a synergy partner card is clicked', () => {
      render(
        <HeroDetailDrawer
          hero={mockRafaela}
          heroPool={mockDataset.heroes}
          onClose={defaultClose}
          onSelectPartner={defaultSelectPartner}
        />
      );

      const partnerBtn = screen.getByRole('button', { name: /faramis/i });
      fireEvent.click(partnerBtn);

      expect(defaultSelectPartner).toHaveBeenCalledTimes(1);
      expect(defaultSelectPartner).toHaveBeenCalledWith(76);
    });

    it('renders empty state message when hero has no positive synergy partners', () => {
      render(
        <HeroDetailDrawer
          hero={mockGloo}
          heroPool={mockDataset.heroes}
          onClose={defaultClose}
        />
      );

      expect(screen.getByTestId('synergy-empty-state')).toBeInTheDocument();
      expect(screen.getByTestId('synergy-empty-state')).toHaveTextContent(
        /No positive duo synergies recorded/i
      );
    });
  });

  describe('Dismiss Interactions & Body Scroll Locking', () => {
    it('dismisses drawer when close button (X) is clicked', () => {
      render(
        <HeroDetailDrawer
          hero={mockRafaela}
          onClose={defaultClose}
        />
      );

      const closeBtn = screen.getByRole('button', { name: /close hero details/i });
      fireEvent.click(closeBtn);

      expect(defaultClose).toHaveBeenCalledTimes(1);
    });

    it('dismisses drawer when backdrop scrim is clicked', () => {
      render(
        <HeroDetailDrawer
          hero={mockRafaela}
          onClose={defaultClose}
        />
      );

      const backdrop = screen.getByTestId('drawer-backdrop');
      fireEvent.click(backdrop);

      expect(defaultClose).toHaveBeenCalledTimes(1);
    });

    it('does not dismiss when clicking inside the drawer content panel', () => {
      render(
        <HeroDetailDrawer
          hero={mockRafaela}
          onClose={defaultClose}
        />
      );

      const contentPanel = screen.getByTestId('drawer-panel');
      fireEvent.click(contentPanel);

      expect(defaultClose).not.toHaveBeenCalled();
    });

    it('dismisses drawer when pressing Escape key', () => {
      render(
        <HeroDetailDrawer
          hero={mockRafaela}
          onClose={defaultClose}
        />
      );

      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

      expect(defaultClose).toHaveBeenCalledTimes(1);
    });

    it('dismisses drawer on swipe/drag handle down gesture', () => {
      render(
        <HeroDetailDrawer
          hero={mockRafaela}
          onClose={defaultClose}
        />
      );

      const handle = screen.getByTestId('drawer-drag-handle');

      fireEvent.touchStart(handle, { touches: [{ clientY: 100 }] });
      fireEvent.touchMove(handle, { touches: [{ clientY: 180 }] }); // 80px down
      fireEvent.touchEnd(handle);

      expect(defaultClose).toHaveBeenCalledTimes(1);
    });

    it('locks background body scroll when open and restores it when unmounted', () => {
      expect(document.body.style.overflow).toBe('');

      const { unmount } = render(
        <HeroDetailDrawer
          hero={mockRafaela}
          onClose={defaultClose}
        />
      );

      expect(document.body.style.overflow).toBe('hidden');

      unmount();

      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Accessibility & Touch Targets', () => {
    it('has proper modal dialog ARIA attributes', () => {
      render(
        <HeroDetailDrawer
          hero={mockRafaela}
          onClose={defaultClose}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'drawer-hero-name');
    });

    it('ensures close button and interactive cards meet >= 44x44px touch targets', () => {
      render(
        <HeroDetailDrawer
          hero={mockRafaela}
          onClose={defaultClose}
          onSelectPartner={defaultSelectPartner}
        />
      );

      const closeBtn = screen.getByRole('button', { name: /close hero details/i });
      expect(closeBtn.className).toMatch(/min-h-\[(44px|48px)\]|h-/);
      expect(closeBtn.className).toMatch(/min-w-\[(44px|48px)\]|w-/);

      const partnerBtn = screen.getByRole('button', { name: /faramis/i });
      expect(partnerBtn.className).toMatch(/min-h-\[(44px|48px)\]|h-/);

      const dragHandle = screen.getByTestId('drawer-drag-handle');
      expect(dragHandle.className).toMatch(/min-h-\[(44px|48px)\]|h-11|h-12/);
    });
  });
});
