import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import React from 'react';
import { WeightTuningDrawer } from '../../src/components/WeightTuningDrawer.tsx';
import { DraftControls } from '../../src/components/DraftControls.tsx';
import { TierListDashboard } from '../../src/components/TierListDashboard.tsx';
import { DEFAULT_WEIGHTS, PRESETS } from '../../src/utils/scoringEngine.ts';
import { mockDataset } from './mockHeroes.ts';

describe('Custom Power Score Weight Controls', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState(null, '', '/');
  });

  describe('WeightTuningDrawer Component', () => {
    it('renders drawer with sliders, presets, ratio bar, and dampening toggle when open', () => {
      render(
        <WeightTuningDrawer
          isOpen={true}
          weights={DEFAULT_WEIGHTS}
          onWeightsChange={vi.fn()}
          onClose={vi.fn()}
          onReset={vi.fn()}
        />
      );

      expect(screen.getByTestId('weight-tuning-drawer')).toBeInTheDocument();
      expect(screen.getByText('Tune Power Score')).toBeInTheDocument();

      // Check 4 presets
      expect(screen.getByTestId('preset-chip-default')).toBeInTheDocument();
      expect(screen.getByTestId('preset-chip-pure_winrate')).toBeInTheDocument();
      expect(screen.getByTestId('preset-chip-ban_priority')).toBeInTheDocument();
      expect(screen.getByTestId('preset-chip-popularity')).toBeInTheDocument();

      // Check 3 sliders
      const wrSlider = screen.getByTestId('slider-wr') as HTMLInputElement;
      const prSlider = screen.getByTestId('slider-pr') as HTMLInputElement;
      const brSlider = screen.getByTestId('slider-br') as HTMLInputElement;

      expect(wrSlider.value).toBe('50');
      expect(prSlider.value).toBe('25');
      expect(brSlider.value).toBe('25');

      // Percentage displays
      expect(screen.getByTestId('pct-wr')).toHaveTextContent('50%');
      expect(screen.getByTestId('pct-pr')).toHaveTextContent('25%');
      expect(screen.getByTestId('pct-br')).toHaveTextContent('25%');

      // Dampening toggle is checked by default
      const dampenToggle = screen.getByTestId('toggle-dampening') as HTMLInputElement;
      expect(dampenToggle.checked).toBe(true);

      // Reset to Default button is disabled because weights are already default
      const resetBtn = screen.getByTestId('btn-reset-weights');
      expect(resetBtn).toBeDisabled();
    });

    it('does not render when isOpen is false', () => {
      render(
        <WeightTuningDrawer
          isOpen={false}
          weights={DEFAULT_WEIGHTS}
          onWeightsChange={vi.fn()}
          onClose={vi.fn()}
          onReset={vi.fn()}
        />
      );

      expect(screen.queryByTestId('weight-tuning-drawer')).not.toBeInTheDocument();
    });

    it('calls onWeightsChange when moving a slider', () => {
      const handleWeightsChange = vi.fn();
      render(
        <WeightTuningDrawer
          isOpen={true}
          weights={DEFAULT_WEIGHTS}
          onWeightsChange={handleWeightsChange}
          onClose={vi.fn()}
          onReset={vi.fn()}
        />
      );

      const wrSlider = screen.getByTestId('slider-wr');
      fireEvent.change(wrSlider, { target: { value: '80' } });

      expect(handleWeightsChange).toHaveBeenCalledTimes(1);
      expect(handleWeightsChange).toHaveBeenCalledWith({
        ...DEFAULT_WEIGHTS,
        wr: 80,
      });
    });

    it('calls onWeightsChange with preset weights when tapping a preset chip', () => {
      const handleWeightsChange = vi.fn();
      render(
        <WeightTuningDrawer
          isOpen={true}
          weights={DEFAULT_WEIGHTS}
          onWeightsChange={handleWeightsChange}
          onClose={vi.fn()}
          onReset={vi.fn()}
        />
      );

      const pureWrChip = screen.getByTestId('preset-chip-pure_winrate');
      fireEvent.click(pureWrChip);

      expect(handleWeightsChange).toHaveBeenCalledWith(PRESETS.pure_winrate.weights);
    });

    it('toggles niche pick dampening flag', () => {
      const handleWeightsChange = vi.fn();
      render(
        <WeightTuningDrawer
          isOpen={true}
          weights={DEFAULT_WEIGHTS}
          onWeightsChange={handleWeightsChange}
          onClose={vi.fn()}
          onReset={vi.fn()}
        />
      );

      const toggle = screen.getByTestId('toggle-dampening');
      fireEvent.click(toggle);

      expect(handleWeightsChange).toHaveBeenCalledWith({
        ...DEFAULT_WEIGHTS,
        dampenNiche: false,
      });
    });

    it('invokes onClose when clicking close button or backdrop', () => {
      const handleClose = vi.fn();
      render(
        <WeightTuningDrawer
          isOpen={true}
          weights={DEFAULT_WEIGHTS}
          onWeightsChange={vi.fn()}
          onClose={handleClose}
          onReset={vi.fn()}
        />
      );

      fireEvent.click(screen.getByTestId('btn-close-weights'));
      expect(handleClose).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByTestId('weight-drawer-backdrop'));
      expect(handleClose).toHaveBeenCalledTimes(2);
    });

    it('enables Reset to Default button when custom weights are active and fires onReset', () => {
      const handleReset = vi.fn();
      render(
        <WeightTuningDrawer
          isOpen={true}
          weights={{ wr: 80, pr: 10, br: 10, dampenNiche: true }}
          onWeightsChange={vi.fn()}
          onClose={vi.fn()}
          onReset={handleReset}
        />
      );

      const resetBtn = screen.getByTestId('btn-reset-weights');
      expect(resetBtn).not.toBeDisabled();

      fireEvent.click(resetBtn);
      expect(handleReset).toHaveBeenCalledTimes(1);
    });
  });

  describe('DraftControls Weights Integration', () => {
    it('renders Weights button and handles click', () => {
      const handleOpenWeights = vi.fn();
      render(
        <DraftControls
          searchQuery=""
          onSearchChange={vi.fn()}
          isBanPriority={false}
          onToggleBanPriority={vi.fn()}
          onOpenWeights={handleOpenWeights}
          isCustomWeights={false}
        />
      );

      const weightsBtn = screen.getByTestId('btn-open-weights');
      expect(weightsBtn).toBeInTheDocument();
      expect(screen.queryByTestId('weights-active-dot')).not.toBeInTheDocument();
      expect(screen.queryByTestId('custom-formula-chip')).not.toBeInTheDocument();

      fireEvent.click(weightsBtn);
      expect(handleOpenWeights).toHaveBeenCalledTimes(1);
    });

    it('displays active dot and custom formula chip when custom weights are active', () => {
      const handleResetWeights = vi.fn();
      render(
        <DraftControls
          searchQuery=""
          onSearchChange={vi.fn()}
          isBanPriority={false}
          onToggleBanPriority={vi.fn()}
          onOpenWeights={vi.fn()}
          isCustomWeights={true}
          weightsSummary="70% WR · 15% PR · 15% BR"
          onResetWeights={handleResetWeights}
        />
      );

      expect(screen.getByTestId('weights-active-dot')).toBeInTheDocument();
      const chip = screen.getByTestId('custom-formula-chip');
      expect(chip).toBeInTheDocument();
      expect(chip).toHaveTextContent('70% WR · 15% PR · 15% BR');

      // Click reset chip
      const resetChipBtn = screen.getByTestId('btn-reset-weights-chip');
      fireEvent.click(resetChipBtn);
      expect(handleResetWeights).toHaveBeenCalledTimes(1);
    });
  });

  describe('TierListDashboard Full End-to-End Weight Flow', () => {
    it('opens WeightTuningDrawer when tapping Weights button in dashboard', () => {
      render(<TierListDashboard dataset={mockDataset} />);

      expect(screen.queryByTestId('weight-tuning-drawer')).not.toBeInTheDocument();

      const weightsBtn = screen.getByTestId('btn-open-weights');
      fireEvent.click(weightsBtn);

      expect(screen.getByTestId('weight-tuning-drawer')).toBeInTheDocument();
    });

    it('dynamically recalculates scores, persists to localStorage and URL when switching presets', () => {
      render(<TierListDashboard dataset={mockDataset} />);

      // Open drawer
      fireEvent.click(screen.getByTestId('btn-open-weights'));

      // Tap Pure Win Rate preset (100% WR, 0% PR, 0% BR, dampen OFF)
      fireEvent.click(screen.getByTestId('preset-chip-pure_winrate'));

      // Check localStorage
      const stored = localStorage.getItem('mlbb_power_score_weights');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.wr).toBe(100);
      expect(parsed.pr).toBe(0);
      expect(parsed.br).toBe(0);
      expect(parsed.dampenNiche).toBe(false);

      // Check URL search params
      const params = new URLSearchParams(window.location.search);
      expect(params.get('wr')).toBe('100');
      expect(params.get('pr')).toBe('0');
      expect(params.get('br')).toBe('0');
      expect(params.get('dampen')).toBe('0');

      // Close drawer
      fireEvent.click(screen.getByTestId('btn-close-weights'));

      // Custom formula chip should be visible on dashboard
      expect(screen.getByTestId('custom-formula-chip')).toHaveTextContent('100% WR · 0% PR · 0% BR');

      // Resetting via chip restores defaults and cleans URL
      fireEvent.click(screen.getByTestId('btn-reset-weights-chip'));
      expect(screen.queryByTestId('custom-formula-chip')).not.toBeInTheDocument();
      expect(localStorage.getItem('mlbb_power_score_weights')).toBeNull();

      const cleanParams = new URLSearchParams(window.location.search);
      expect(cleanParams.get('wr')).toBeNull();
      expect(cleanParams.get('pr')).toBeNull();
      expect(cleanParams.get('br')).toBeNull();
    });

    it('hydrates initial weights from URL parameters on load', () => {
      window.history.replaceState(null, '', '/?wr=80&pr=10&br=10&dampen=0');

      render(<TierListDashboard dataset={mockDataset} />);

      // Should automatically render custom formula chip
      const chip = screen.getByTestId('custom-formula-chip');
      expect(chip).toBeInTheDocument();
      expect(chip).toHaveTextContent('80% WR · 10% PR · 10% BR');
    });

    it('hydrates initial weights from localStorage on load if URL params are not set', () => {
      localStorage.setItem(
        'mlbb_power_score_weights',
        JSON.stringify({ wr: 30, pr: 20, br: 50, dampenNiche: true })
      );

      render(<TierListDashboard dataset={mockDataset} />);

      const chip = screen.getByTestId('custom-formula-chip');
      expect(chip).toBeInTheDocument();
      expect(chip).toHaveTextContent('30% WR · 20% PR · 50% BR');
    });
  });
});
